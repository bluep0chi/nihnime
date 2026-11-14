"use client";
// Helper fetch ke API internal + penyimpanan lokal (bookmark & riwayat)
export async function api(path) {
  const res = await fetch(path);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status !== 200) throw new Error(body.message || "Gagal memuat data");
  return body.data;
}

const KEY = { bookmark: "nihnime:bookmark", history: "nihnime:history" };
export const store = {
  read(key, fallback = []) {
    try { const value = JSON.parse(localStorage.getItem(KEY[key])); return Array.isArray(value) ? value : fallback; } catch { return fallback; }
  },
  write(key, value) { try { localStorage.setItem(KEY[key], JSON.stringify(value)); } catch { /* Penyimpanan browser mungkin dinonaktifkan atau penuh. */ } },
  toggleBookmark(anime) {
    const list = store.read("bookmark");
    const exists = list.some((a) => String(a.id) === String(anime.id));
    const next = exists ? list.filter((a) => String(a.id) !== String(anime.id)) : [{ id: anime.id, title: anime.title, image_poster: anime.image_poster, type: anime.type, year: anime.year, aired_start: anime.aired_start, genre: anime.genre }, ...list];
    store.write("bookmark", next);
    return !exists;
  },
  isBookmarked(id) { return store.read("bookmark").some((a) => String(a.id) === String(id)); },
  pushHistory(item) {
    const prev = store.read("history").find((h) => String(h.episodeId) === String(item.episodeId));
    const list = store.read("history").filter((h) => String(h.episodeId) !== String(item.episodeId));
    store.write("history", [{ ...prev, ...item, at: Date.now() }, ...list].slice(0, 60));
  },
  saveProgress(episodeId, current, duration) {
    if (!Number.isFinite(duration) || !Number.isFinite(current) || duration <= 0 || current < 5) return;
    const list = store.read("history").map((h) =>
      String(h.episodeId) === String(episodeId) ? { ...h, progress: Math.round(current), duration: Math.round(duration) } : h
    );
    store.write("history", list);
  },
  getProgress(episodeId) {
    const h = store.read("history").find((x) => String(x.episodeId) === String(episodeId));
    if (!h?.progress || !h?.duration) return 0;
    // jangan resume kalau sudah hampir selesai
    return h.progress < h.duration - 30 ? h.progress : 0;
  },
};

export function formatViews(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "jt";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "rb";
  return String(n);
}
