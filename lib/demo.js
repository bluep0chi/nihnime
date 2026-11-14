// Data contoh (demo) — dipakai HANYA sebagai fallback kalau API AnimeIn
// tidak terjangkau dari server (mis. sandbox/preview yang outbound-nya dibatasi).
// Di Vercel/produksi, API asli selalu dicoba dulu; demo tidak akan tampil
// selama API merespons normal. Semua respons demo diberi flag `demo: true`.
const poster = (seed) => `https://picsum.photos/seed/nihnime-${seed}/300/400`;
const cover = (seed) => `https://picsum.photos/seed/nihnime-cover-${seed}/1280/720`;

const TITLES = [
  ["Naruto: Shippuden", "TV", 2007, "Action, Adventure, Fantasy", "Pierrot"],
  ["One Piece", "TV", 1999, "Action, Adventure, Comedy", "Toei Animation"],
  ["Jujutsu Kaisen", "TV", 2023, "Action, Supernatural, Dark Fantasy", "MAPPA"],
  ["Demon Slayer: Kimetsu no Yaiba", "TV", 2023, "Action, Fantasy, Historical", "ufotable"],
  ["Attack on Titan", "TV", 2023, "Action, Drama, Fantasy", "MAPPA"],
  ["My Hero Academia", "TV", 2024, "Action, School, Superhero", "Bones"],
  ["Spy x Family", "TV", 2023, "Action, Comedy, Slice of Life", "Wit Studio"],
  ["Chainsaw Man", "TV", 2022, "Action, Horror, Supernatural", "MAPPA"],
  ["Frieren: Beyond Journey's End", "TV", 2024, "Adventure, Drama, Fantasy", "Madhouse"],
  ["Solo Leveling", "TV", 2024, "Action, Adventure, Fantasy", "A-1 Pictures"],
  ["Kaiju No. 8", "TV", 2024, "Action, Sci-Fi, Supernatural", "Production I.G"],
  ["Wind Breaker", "TV", 2024, "Action, School, Drama", "CloverWorks"],
];

export const DEMO_ANIME = TITLES.map(([title, type, year, genre, studio], i) => ({
  id: i + 1,
  title,
  image_poster: poster(i + 1),
  image_cover: cover(i + 1),
  type,
  year,
  day: null,
  status: "Finished Airing",
  genre,
  studio,
  views: 900000 - i * 42000,
  views_raw: String(900000 - i * 42000),
  favorites: 12000 - i * 300,
  synopsis:
    "Ini adalah data contoh untuk mode demo. Di produksi, sinopsis asli diambil dari API AnimeIn. " +
    title +
    " — anime " +
    genre +
    " produksi " +
    studio +
    " (" +
    year +
    ").",
  synonyms: title + " (Sub Indo)",
  aired_start: String(year) + "-01-01",
  aired_end: String(year) + "-12-31",
  latest_episode: "Episode " + (24 - i),
  demo: true,
}));

const pick = (n, offset = 0) => DEMO_ANIME.slice(offset, offset + n);

export function demoHome() {
  return {
    demo: true,
    day: "SENIN",
    banner: pick(4).map((a, i) => ({ id: a.id, image: cover(i + 1), type: a.type, link: String(a.id) })),
    episode_baru: pick(8, 0),
    sedang_hangat: pick(8, 2),
    judul_baru: pick(8, 4),
    jadwal_hari_ini: pick(8, 1),
    paling_populer: pick(8, 0),
    paling_dinanti: pick(8, 3),
    acak: pick(8, 5),
  };
}

export function demoSchedule(day) {
  const d = (day || "SENIN").toUpperCase();
  return { [d]: pick(8, (d.length % 5)) };
}

export function demoExplore() {
  return {
    genre: [
      { id: 1, name: "Action", poster: poster(1), group: "Genre" },
      { id: 2, name: "Adventure", poster: poster(2), group: "Genre" },
      { id: 3, name: "Comedy", poster: poster(3), group: "Genre" },
      { id: 4, name: "Drama", poster: poster(4), group: "Genre" },
      { id: 5, name: "Fantasy", poster: poster(5), group: "Genre" },
      { id: 6, name: "Romance", poster: poster(6), group: "Genre" },
      { id: 7, name: "School", poster: poster(7), group: "Theme" },
      { id: 8, name: "Shounen", poster: poster(8), group: "Demographic" },
      { id: 9, name: "Seinen", poster: poster(9), group: "Demographic" },
    ],
    tahun: [2024, 2023, 2022, 2021, 2020].map((y) => ({ name: String(y), poster: poster(y % 10) })),
    studio: ["MAPPA", "ufotable", "Pierrot", "Toei Animation", "Madhouse"].map((name, i) => ({ id: i + 1, name })),
    tipe: ["TV", "Movie", "ONA", "OVA", "Special"].map((name, i) => ({ id: i + 1, name })),
    karakter: [],
    trailer: [],
  };
}

export function demoList({ keyword = "" } = {}) {
  const q = String(keyword || "").toLowerCase();
  return q ? DEMO_ANIME.filter((a) => a.title.toLowerCase().includes(q)) : [...DEMO_ANIME];
}

export function demoEpisodes(movieId) {
  const n = 24;
  return Array.from({ length: n }, (_, i) => ({
    id: Number(movieId || 1) * 1000 + (n - i),
    index: n - i,
    title: "Episode " + (n - i),
    views: 50000 - i * 1000,
    key_time: "2024-01-01",
    is_new: i === 0 ? "Y" : "N",
    image: cover((i % 6) + 1),
    id_movie: Number(movieId || 1),
  }));
}

export function demoDetail(movieId) {
  const base = DEMO_ANIME.find((a) => String(a.id) === String(movieId)) || DEMO_ANIME[0];
  return {
    ...base,
    seasons: pick(3, 1).filter((a) => a.id !== base.id),
    episodes: demoEpisodes(base.id),
    episode_total: 24,
    episode_detail: null,
    is_fav: false,
  };
}

export function demoStream(episodeId) {
  return {
    demo: true,
    episode: { id: Number(episodeId || 1), index: 1, title: "Episode 1", views: 12345, id_movie: 1 },
    episode_next: null,
    servers: [
      {
        server_id: 1,
        name: "Demo",
        quality: "720",
        type: "mp4",
        file_size: "Demo",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    ],
  };
}

export function demoFyp() {
  return pick(6).map((a, i) => ({
    id_fyp: i + 1,
    caption: a.title + " — cuplikan demo",
    anime_id: a.id,
    anime_title: a.title,
    episode: 1,
    id_episode: a.id * 1000 + 24,
    url_thumbnail: cover(i + 1),
    poster: a.image_poster,
    views: 8000 - i * 500,
    likes: 900 - i * 40,
  }));
}
