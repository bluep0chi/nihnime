// Server-side client API AnimeIn — diadaptasi dari scraper APK ANIMEIN 5.2.2.
// Hanya dipakai di server (Route Handlers) supaya UA okhttp tidak kena Cloudflare & tidak ada CORS.
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

async function call(path, params = {}, revalidate = 300) {
  await boot();
  const url = new URL(apiBase + "/" + String(path).replace(/^\//, ""));
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }
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
  for (const k of ["time", "key_time", "key_time_update", "season", "is_new"]) if (m[k] !== undefined) out[k] = m[k];
  if (out.key_time_update && /^episode/i.test(String(out.genre || ""))) { out.latest_episode = out.genre; out.genre = null; }
  return Object.assign(out, extra);
}
const cards = (list) => (list || []).map((m) => card(m)).filter(Boolean);

export async function getHome(limit = 24) {
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

export async function getSchedule(day) {
  const days = !day || day.toUpperCase() === "SEMUA" ? [...DAYS, "RANDOM"] : [day.toUpperCase()];
  const out = {};
  for (const d of days) {
    const raw = await call("3/2/schedule/data", { day: d }, 600);
    out[d] = cards(raw.movie);
  }
  return out;
}

export async function getExplore() {
  const raw = await call("3/2/explore/data", { limit: 50 }, 3600);
  return {
    genre: (raw.genre || []).map((g) => ({ id: g.id, name: g.name, poster: normalizeImage(g.image), group: g.group })),
    tahun: (raw.year || []).map((y) => ({ name: y.name, poster: normalizeImage(y.image) })),
    studio: (raw.studio || []).map((s) => ({ id: s.id, name: s.name })),
    tipe: (raw.tipe || []).map((t) => ({ id: t.id, name: t.name })),
  };
}

export async function getGenres() {
  const raw = await call("3/2/explore/genre", {}, 3600);
  return (raw.genre || []).map((g) => ({ id: g.id, name: g.name, poster: normalizeImage(g.image), group: g.group }));
}

const PATHS = { search: "3/2/explore/movie", genre: "3/2/explore/movie_genre", studio: "3/2/explore/movie_studio", year: "3/2/explore/movie_year", type: "3/2/explore/movie_type" };
export async function getList({ mode = "search", keyword = "", genre = [], sort = "views", page = 0, id_genre = "", studio = "", year = "", season = "", type = "" }) {
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
}

export async function getDetail(movieId) {
  const mid = String(movieId).match(/\d+/)?.[0];
  if (!mid) throw new Error("ID tidak valid");
  const raw = await call(`3/2/movie/detail/${mid}`, {}, 120);
  const m = raw.movie;
  if (!m?.id) throw new Error("Anime tidak ditemukan");
  const info = card(m);
  info.seasons = cards(raw.season);
  // episode halaman pertama; halaman berikutnya via getEpisodes()
  info.episodes = await getEpisodes(mid, 0);
  return info;
}

export async function getEpisodes(movieId, page = 0, search = "") {
  const mid = String(movieId).match(/\d+/)?.[0];
  const raw = await call(`3/2/movie/episode/${mid}`, { page, search }, 60);
  return (raw.episode || []).map((e) => ({
    id: e.id, index: e.index, title: e.title, views: num(e.views),
    key_time: e.key_time, is_new: e.is_new, image: normalizeImage(e.image), id_movie: e.id_movie,
  }));
}

export async function getStream(episodeId) {
  const eid = String(episodeId).match(/\d+/)?.[0];
  if (!eid) throw new Error("ID episode tidak valid");
  const raw = await call(`3/2/episode/streamnew/${eid}`, {}, 0);
  const ep = raw.episode || {};
  const servers = (raw.server || []).map((s) => ({
    server_id: s.server_id, name: s.name, quality: s.quality, type: s.type,
    file_size: s.key_file_size, url: s.link,
  })).sort((a, b) => parseInt(a.quality) - parseInt(b.quality));
  return { episode: { id: ep.id, index: ep.index, title: ep.title, views: num(ep.views), id_movie: ep.id_movie }, episode_next: raw.episode_next || null, servers };
}
