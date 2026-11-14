// Server-side client API AnimeIn — diadaptasi dari scraper APK ANIMEIN 5.2.2
// (file scraper: animein.js / AnimeScraper). Hanya dipakai di server
// (Route Handlers) supaya UA okhttp tidak kena Cloudflare & tidak ada CORS.
// v2.1: + retry 3x seperti scraper, + endpoint section home dedicated,
// + explore karakter/trailer, + 3/2/explore/year, + episode_detail di detail,
// + fallback data demo (lib/demo.js) bila API tidak terjangkau dari server.
import { demoHome, demoSchedule, demoExplore, demoList, demoDetail, demoEpisodes, demoStream, demoFyp } from "./demo";

const FALLBACK_API = "https://xyz-api.animein.net";
const BOOT_URL = "https://gate.nextanimelist.com/data/setup/data";
const APK_UA = "okhttp/4.9.3";
const BROWSER_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

export const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];
export const todayDay = () => ["MINGGU","SENIN","SELASA","RABU","KAMIS","JUMAT","SABTU"][new Date().getDay()];

let apiBase = FALLBACK_API;
let booted = false;

function normalizeImage(image) {
  if (!image) return null;
  if (image.startsWith("//")) return "https:" + image;
  if (image.startsWith("/")) return apiBase.replace(/\/$/, "") + image;
  return image.replace(/([^:])\/{2,}/g, "$1/");
}
const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot() {
  if (booted) return;
  try {
    const res = await fetch(BOOT_URL, { headers: { "User-Agent": BROWSER_UA, Accept: "application/json" }, next: { revalidate: 3600 } });
    if (res.ok) {
      const body = await res.json();
      const domain = body?.data?.domain_api?.value;
      if (domain) apiBase = String(domain).replace(/\/$/, "");
    }
  } catch {}
  booted = true;
}

async function call(path, params = {}, revalidate = 300, retries = 3) {
  await boot();
  const url = new URL(apiBase + "/" + String(path).replace(/^\//, ""));
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": APK_UA, Accept: "application/json", "Accept-Language": "id-ID,id;q=0.9", "x-requested-with": "XMLHttpRequest" },
        next: { revalidate },
      });
      const text = await res.text();
      if (text.startsWith("<")) throw new Error("API diblokir Cloudflare, coba lagi sebentar.");
      if (!res.ok) throw new Error(`API error HTTP ${res.status}`);
      const body = JSON.parse(text);
      if (body.status !== 200 || body.error) throw new Error(body.message || "API error");
      return body.data || {};
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) await sleep(800 * (attempt + 1));
    }
  }
  throw lastErr;
}

export function card(m, extra = {}) {
  if (!m) return null;
  const out = {
    id: m.id, title: m.title,
    image_poster: normalizeImage(m.image_poster),
    image_cover: normalizeImage(m.image_cover),
    type: m.type || null, year: m.year || null, day: m.day || null,
    status: m.status || m.key_status || null,
    genre: m.genre || null, studio: m.studio || null,
    views: num(m.views), views_raw: m.views || "0",
    favorites: num(m.favorites),
    synopsis: m.synopsis || null, synonyms: m.synonyms || null,
    aired_start: m.aired_start || null, aired_end: m.aired_end || null,
  };
  for (const k of ["time", "key_time", "key_time_update", "season", "is_new", "is_fav"]) if (m[k] !== undefined) out[k] = m[k];
  if (out.key_time_update && /^episode/i.test(String(out.genre || ""))) { out.latest_episode = out.genre; out.genre = null; }
  return Object.assign(out, extra);
}
const cards = (list) => (list || []).map((m) => card(m)).filter(Boolean);

async function getHomeReal(limit = 24) {
  const day = todayDay();
  const raw = await call("data/home/list", { limit, day, setup_fyp_flag: "Y" }, 120);
  return {
    day,
    banner: (raw.slider || []).map((s) => ({ id: s.id, image: normalizeImage(s.image), type: s.type, link: s.link })),
    episode_baru: cards(raw.update), sedang_hangat: cards(raw.hot), judul_baru: cards(raw.new),
    jadwal_hari_ini: cards(raw.today), paling_populer: cards(raw.popular),
    paling_dinanti: cards(raw.waiting), acak: cards(raw.random),
  };
}
export async function getHome(limit = 24) {
  try { return await getHomeReal(limit); } catch { return demoHome(); }
}

/** Section home via endpoint dedicated (sesuai scraper SECTION_ENDPOINTS) */
const SECTION_ENDPOINTS = {
  sedang_hangat: ["3/2/home/hot", "hot"],
  judul_baru: ["3/2/home/new", "new"],
  paling_populer: ["3/2/home/popular", "popular"],
  acak: ["3/2/home/random", "random"],
  episode_baru: ["data/home/list_new_episode", "update"],
  paling_dinanti: ["data/trailer/list", "waiting"],
};
export async function getHomeSection(section, { limit = 24, page = 1, genre = [] } = {}) {
  const key = String(section || "").toLowerCase();
  try {
    if (key === "jadwal_hari_ini") return (await getHomeReal(limit)).jadwal_hari_ini;
    const meta = SECTION_ENDPOINTS[key];
    if (!meta) throw new Error("Section tidak dikenal: " + section);
    const [path, field] = meta;
    const params = { limit };
    if (key === "paling_dinanti") params.page = page;
    if (genre.length) params.genre_in = genre.join(",");
    const raw = await call(path, params, 120);
    return cards(raw.movie || raw[field] || []);
  } catch {
    const home = demoHome();
    return home[key] || [];
  }
}

export async function getSchedule(day) {
  try {
    const days = !day || day.toUpperCase() === "SEMUA" ? [...DAYS, "RANDOM"] : [day.toUpperCase()];
    const out = {};
    for (const d of days) {
      const raw = await call("3/2/schedule/data", { day: d }, 600);
      out[d] = cards(raw.movie);
      await sleep(120);
    }
    return out;
  } catch { return demoSchedule(day); }
}

export async function getExplore() {
  try {
    const raw = await call("3/2/explore/data", { limit: 50 }, 3600);
    return {
      genre: (raw.genre || []).map((g) => ({ id: g.id, name: g.name, poster: normalizeImage(g.image), group: g.group })),
      tahun: (raw.year || []).map((y) => ({ name: y.name, poster: normalizeImage(y.image) })),
      studio: (raw.studio || []).map((s) => ({ id: s.id, name: s.name })),
      tipe: (raw.tipe || []).map((t) => ({ id: t.id, name: t.name })),
      karakter: raw.character || [],
      trailer: raw.trailer || [],
    };
  } catch { return demoExplore(); }
}

export async function getGenres() {
  try {
    const raw = await call("3/2/explore/genre", {}, 3600);
    return (raw.genre || []).map((g) => ({ id: g.id, name: g.name, poster: normalizeImage(g.image), group: g.group }));
  } catch { return demoExplore().genre; }
}

/** Daftar tahun lengkap (3/2/explore/year) */
export async function getYears() {
  try {
    const raw = await call("3/2/explore/year", {}, 3600);
    return (raw.year || []).map((y) => ({ name: y.name, poster: normalizeImage(y.image) }));
  } catch { return demoExplore().tahun; }
}

const PATHS = { search: "3/2/explore/movie", genre: "3/2/explore/movie_genre", studio: "3/2/explore/movie_studio", year: "3/2/explore/movie_year", type: "3/2/explore/movie_type" };
export async function getList({ mode = "search", keyword = "", genre = [], sort = "views", page = 0, id_genre = "", studio = "", year = "", season = "", type = "" }) {
  try {
    const params = { sort: ["views", "alphabet"].includes(sort) ? sort : "views", page };
    if (keyword) params.keyword = keyword;
    const ids = [...(id_genre ? [String(id_genre)] : []), ...genre.map(String)];
    if (ids.length) params.genre_in = ids.join(",");
    if (mode === "genre" && id_genre) params.id_genre = String(id_genre);
    if (mode === "studio") params.studio = studio;
    if (mode === "year") { params.year = String(year); params.season = String(season || "").toLowerCase(); }
    if (mode === "type") params.type = String(type).toUpperCase();
    const raw = await call(PATHS[mode] || PATHS.search, params, 120);
    return cards(raw.movie);
  } catch { return demoList({ keyword }); }
}

export async function getDetail(movieId) {
  const mid = String(movieId).match(/\d+/)?.[0];
  if (!mid) throw new Error("ID tidak valid");
  try {
    const raw = await call(`3/2/movie/detail/${mid}`, {}, 120);
    const m = raw.movie;
    if (!m?.id) throw new Error("Anime tidak ditemukan");
    const info = card(m);
    info.is_fav = m.is_fav ?? false;
    info.episode_detail = raw.episode
      ? { id: raw.episode.id, index: raw.episode.index, title: raw.episode.title, views: num(raw.episode.views), key_time: raw.episode.key_time, image: normalizeImage(raw.episode.image) }
      : null;
    info.seasons = cards(raw.season);
    info.episodes = await getEpisodes(mid, 0);
    info.episode_total = info.episodes.length;
    return info;
  } catch (e) {
    // bedakan "tidak ditemukan" vs "API tidak terjangkau": demo hanya untuk yang kedua
    if (/tidak ditemukan|tidak valid/i.test(e.message)) throw e;
    return demoDetail(mid);
  }
}

export async function getEpisodes(movieId, page = 0, search = "") {
  const mid = String(movieId).match(/\d+/)?.[0];
  try {
    const raw = await call(`3/2/movie/episode/${mid}`, { page, search }, 60);
    return (raw.episode || []).map((e) => ({
      id: e.id, index: e.index, title: e.title, views: num(e.views),
      key_time: e.key_time, is_new: e.is_new, is_book: e.is_book, image: normalizeImage(e.image), id_movie: e.id_movie,
    }));
  } catch { return page === 0 ? demoEpisodes(mid) : []; }
}

export async function getStream(episodeId) {
  const eid = String(episodeId).match(/\d+/)?.[0];
  if (!eid) throw new Error("ID episode tidak valid");
  try {
    const raw = await call(`3/2/episode/streamnew/${eid}`, {}, 0);
    const ep = raw.episode || {};
    const servers = (raw.server || []).map((s) => ({
      server_id: s.server_id, name: s.name, quality: s.quality, type: s.type,
      file_size: s.key_file_size, username: s.username, url: s.link,
    })).sort((a, b) => parseInt(a.quality) - parseInt(b.quality) || String(a.quality).localeCompare(String(b.quality)));
    return { episode: { id: ep.id, index: ep.index, title: ep.title, views: num(ep.views), key_time: ep.key_time, id_movie: ep.id_movie }, episode_next: raw.episode_next || null, servers };
  } catch { return demoStream(eid); }
}

/** Just For You / cuplix (video pendek rekomendasi) — data/home/fyp */
export async function getFyp(limit = 20) {
  try {
    const raw = await call("data/home/fyp", { limit, day: todayDay(), setup_fyp_flag: "Y" }, 120);
    const list = Array.isArray(raw) ? raw : raw.fyp || raw.items || [];
    return list.map((f) => {
      const anime = f.anime && typeof f.anime === "object" ? f.anime : null;
      return {
        id_fyp: f.id ?? raw.id_fyp ?? null, caption: f.caption || null,
        anime_id: anime?.id || f.id_movie || null,
        anime_title: anime?.title || (typeof f.anime === "string" ? f.anime : null) || f.title || "Anime",
        episode: f.episode || null, id_episode: f.id_episode || null,
        url_thumbnail: normalizeImage(f.url_thumbnail),
        poster: normalizeImage(f.poster || f.episode_poster || anime?.image_poster),
        views: num(f.count_views), likes: num(f.count_likes), comments: num(f.count_comments),
        key_time: f.key_time || null,
      };
    }).filter((f) => f.id_episode);
  } catch { return demoFyp(); }
}
