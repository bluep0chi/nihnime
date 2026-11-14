// Contoh untuk preview offline. ID demo tidak boleh menggantikan ID asli.
const ART = [
  ["https://api.animein.net/assets/images/movie/poster/32cbcdb1e524a1fb52273c0c95c98ffc.jpg", "https://api.animein.net/assets/images/movie/cover/8183c928bf781f161b4d01fe95536b35.jpg"],
  ["https://xyz-api.animein.net/assets_xyz/images/movie/poster/3b58031b55ceb0a20b1cb56c20933153.jpg", "https://xyz-api.animein.net/assets_xyz/images/movie/cover/44c73f7442fc918860f9c298967584e4.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/f945fb40d51bbe5be0ec01b87395baaf.jpg", "https://api.animein.net/assets/images/movie/cover/fa74358ee6d4a1d17e5533fd634e9d77.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/3efe7ba570079c9dcc852203e07dadfe.jpg", "https://api.animein.net/assets/images/movie/cover/f27e8cc6f77de531f31d0bca148e543c.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/406291ef604551e5c370e05d183415e7.jpg", "https://api.animein.net/assets/images/movie/cover/d7fcddd36974f9325b768333dfc923f0.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/d9c76f78afbcd42ca71a80acb7b3547c.jpg", "https://api.animein.net/assets/images/movie/cover/e4bd49f7d624b0f72f9b3d7b7a8b8052.jpg"],
  ["https://xyz-api.animein.net/assets_xyz/images/movie/poster/16317cf33982fd28bfe2e21e11ae4098.jpg", "https://api.animein.net/assets/images/movie/cover/596781cb4f5d913de800d3e60152bca6.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/44fba806a829de66fba78a43d5ec92b0.jpg", "https://api.animein.net/assets/images/movie/cover/8b7b4b9a42ef95388b05d35d808f9f72.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/3c0766aa3fdbb8d1e5a68d6e8bde9b4a.jpg", "https://xyz-api.animein.net/assets_xyz/images/movie/cover/94826ef80d41d0994059d180bc57178a.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/a81c9a5c14ded5f295d8ceb61e466790.jpg", "https://api.animein.net/assets/images/movie/cover/c6f4bc175dd0aaba9ceab5252b00a331.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/90d2c88baf66ccb17cd6c7c6948785fa.jpg", "https://api.animein.net/assets/images/movie/cover/2c0c139aaff1b4c3cf05757db5af4045.jpg"],
  ["https://api.animein.net/assets/images/movie/poster/2f8702e65388eb50a566845c131400e5.jpg", "https://api.animein.net/assets/images/movie/cover/3cc8b57dc31f6de333356e8dd9a4d617.jpg"],
];
const poster = (seed) => ART[Number(seed) - 1]?.[0] || "/images/poster-unavailable.svg";
const cover = (seed) => ART[Number(seed) - 1]?.[1] || "/images/poster-unavailable.svg";
const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU", "RANDOM"];
const GENRES = [
  { id: 1, name: "Action", group: "Genre" }, { id: 2, name: "Adventure", group: "Genre" },
  { id: 3, name: "Comedy", group: "Genre" }, { id: 4, name: "Drama", group: "Genre" },
  { id: 5, name: "Fantasy", group: "Genre" }, { id: 6, name: "Romance", group: "Genre" },
  { id: 7, name: "School", group: "Theme" }, { id: 8, name: "Shounen", group: "Demographic" },
  { id: 9, name: "Seinen", group: "Demographic" },
];
const TITLES = [
  ["Naruto: Shippuden", "SERIES", 2007, "Action, Adventure, Fantasy", "Pierrot"],
  ["One Piece", "SERIES", 1999, "Action, Adventure, Comedy", "Toei Animation"],
  ["Jujutsu Kaisen", "SERIES", 2023, "Action, Supernatural, Dark Fantasy", "MAPPA"],
  ["Demon Slayer: Kimetsu no Yaiba", "SERIES", 2023, "Action, Fantasy, Historical", "ufotable"],
  ["Attack on Titan", "SERIES", 2023, "Action, Drama, Fantasy", "MAPPA"],
  ["My Hero Academia", "SERIES", 2024, "Action, School, Superhero", "Bones"],
  ["Spy x Family", "SERIES", 2023, "Action, Comedy, Slice of Life", "Wit Studio"],
  ["Chainsaw Man", "SERIES", 2022, "Action, Horror, Supernatural", "MAPPA"],
  ["Frieren: Beyond Journey's End", "SERIES", 2024, "Adventure, Drama, Fantasy", "Madhouse"],
  ["Solo Leveling", "SERIES", 2024, "Action, Adventure, Fantasy", "A-1 Pictures"],
  ["Kaiju No. 8", "SERIES", 2024, "Action, Sci-Fi, Supernatural", "Production I.G"],
  ["Wind Breaker", "SERIES", 2024, "Action, School, Drama", "CloverWorks"],
];
export const DEMO_ANIME = TITLES.map(([title, type, year, genre, studio], i) => ({
  id: `demo-${i + 1}`, title, image_poster: poster(i + 1), image_cover: cover(i + 1), type, year,
  day: DAYS[i % 7], status: i % 3 === 1 ? "ONGOING" : "FINISHED", genre, studio,
  views: 900000 - i * 42000, views_raw: String(900000 - i * 42000), favorites: 12000 - i * 300,
  synopsis: `Ini adalah data contoh untuk mode demo. Di produksi, sinopsis asli diambil dari API AnimeIn. ${title} — anime ${genre} produksi ${studio} (${year}).`,
  synonyms: `${title} (Sub Indo)`, aired_start: `${year}-01-01`, aired_end: `${year}-12-31`,
  latest_episode: `Episode ${24 - i}`, demo: true,
}));
const pick = (n, offset = 0) => DEMO_ANIME.slice(offset, offset + n);
const demoAnime = (id) => DEMO_ANIME.find((a) => String(a.id) === String(id));
const unavailable = () => new Error("API AnimeIn tidak tersedia untuk judul ini. Silakan coba lagi.");

export function demoHome() {
  return { demo: true, day: "SENIN", banner: pick(4).map((a, i) => ({ id: a.id, image: cover(i + 1), type: a.type, link: String(a.id) })), episode_baru: pick(8), sedang_hangat: pick(8, 2), judul_baru: pick(8, 4), jadwal_hari_ini: pick(8, 1), paling_populer: pick(8), paling_dinanti: pick(8, 3), acak: pick(8, 5) };
}
export function demoSchedule(day) {
  const requested = String(day || "SEMUA").toUpperCase();
  const days = requested === "SEMUA" ? DAYS : [requested];
  return Object.fromEntries(days.map((d, i) => [d, [DEMO_ANIME[i % DEMO_ANIME.length], DEMO_ANIME[(i + 4) % DEMO_ANIME.length]].map((a) => ({ ...a, time: "Contoh" }))]));
}
export function demoExplore() {
  return { genre: GENRES.map((g) => ({ ...g, poster: poster(g.id), demo: true })), tahun: [2024, 2023, 2022, 2021, 2020, 2007, 1999].map((y) => ({ name: String(y), poster: poster(y % 10) })), studio: ["MAPPA", "ufotable", "Pierrot", "Toei Animation", "Madhouse"].map((name, i) => ({ id: i + 1, name })), tipe: ["SERIES", "MOVIE", "ONA", "OVA", "SPECIAL"].map((name, i) => ({ id: i + 1, name })), karakter: [], trailer: [] };
}
export function demoList({ mode = "search", keyword = "", genre = [], sort = "views", page = 0, id_genre = "", studio = "", year = "", type = "" } = {}) {
  const terms = [...(id_genre ? [id_genre] : []), ...genre].map((id) => GENRES.find((g) => String(g.id) === String(id))?.name.toLowerCase()).filter(Boolean);
  const q = String(keyword).toLowerCase();
  let list = DEMO_ANIME.filter((a) => (!q || a.title.toLowerCase().includes(q)) && terms.every((term) => a.genre.toLowerCase().includes(term)));
  if (mode === "studio" && studio) list = list.filter((a) => a.studio.toLowerCase() === String(studio).toLowerCase());
  if (mode === "year" && year) list = list.filter((a) => String(a.year) === String(year));
  if (mode === "type" && type) list = list.filter((a) => a.type === String(type).toUpperCase());
  if (sort === "alphabet") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  const size = 30;
  return list.slice(Math.max(0, Number(page) || 0) * size, (Math.max(0, Number(page) || 0) + 1) * size);
}
export function demoEpisodes(movieId, page = 0, search = "") {
  if (!demoAnime(movieId)) throw unavailable();
  const q = String(search).trim().toLowerCase();
  const episodes = Array.from({ length: 24 }, (_, i) => ({ id: `demo-${Number(String(movieId).slice(5)) * 1000 + (24 - i)}`, index: 24 - i, title: `Episode ${24 - i}`, views: 50000 - i * 1000, key_time: "2024-01-01", is_new: i === 0 ? "1" : "0", image: cover((i % 6) + 1), id_movie: String(movieId), demo: true })).filter((ep) => !q || ep.title.toLowerCase().includes(q));
  return episodes.slice(Math.max(0, Number(page) || 0) * 30, (Math.max(0, Number(page) || 0) + 1) * 30);
}
export function demoDetail(movieId) {
  const base = demoAnime(movieId);
  if (!base) throw unavailable();
  return { ...base, seasons: pick(3, 1).filter((a) => a.id !== base.id), episodes: demoEpisodes(base.id), episode_total: 24, episode_detail: null, is_fav: false };
}
export function demoStream(episodeId) {
  if (!/^demo-\d+$/.test(String(episodeId))) throw unavailable();
  const eid = Number(String(episodeId).slice(5));
  const movieId = `demo-${Math.floor(eid / 1000)}`;
  const index = eid % 1000;
  if (!demoAnime(movieId) || index < 1 || index > 24) throw unavailable();
  return { demo: true, episode: { id: `demo-${eid}`, index, title: `Episode ${index}`, views: 12345, id_movie: movieId }, episode_next: index < 24 ? { id: `demo-${eid + 1}`, index: index + 1 } : null, servers: [{ server_id: 1, name: "Demo", quality: "720p", type: "direct", file_size: null, url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }] };
}
export function demoFyp() {
  return pick(6).map((a, i) => ({ id_fyp: i + 1, caption: `${a.title} — cuplikan demo`, anime_id: a.id, anime_title: a.title, episode: 1, id_episode: `demo-${(i + 1) * 1000 + 24}`, url_thumbnail: cover(i + 1), poster: a.image_poster, views: 8000 - i * 500, likes: 900 - i * 40, demo: true }));
}
