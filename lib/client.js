"use client";
import { resumablePosition } from "./player.mjs";
import { historyId, isCompletedHistory } from "./history.mjs";

// Helper fetch ke API internal + penyimpanan lokal (bookmark & riwayat)
export async function api(path) {
  const res = await fetch(path);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status !== 200) throw new Error(body.message || "Gagal memuat data");
  return body.data;
}

const KEY = { bookmark: "nihnime:bookmark", history: "nihnime:history", watched: "nihnime:watched" };
const CHANGE_EVENT = "nihnime:store-change";
export const store = {
  read(key, fallback = []) {
    try { const value = JSON.parse(localStorage.getItem(KEY[key])); return Array.isArray(value) ? value : fallback; } catch { return fallback; }
  },
  write(key, value) {
    try {
      localStorage.setItem(KEY[key], JSON.stringify(value));
      // The native storage event only reaches other tabs, not this one.
      if (typeof window !== "undefined") window.dispatchEvent(new window.CustomEvent(CHANGE_EVENT, { detail: key }));
    } catch { /* Penyimpanan browser mungkin dinonaktifkan atau penuh. */ }
  },
  subscribe(keys, onChange) {
    if (typeof window === "undefined") return () => {};
    const wanted = new Set(keys);
    const localChange = (event) => { if (wanted.has(event.detail)) onChange(); };
    const otherTab = (event) => { if (event.key === null || [...wanted].some((key) => KEY[key] === event.key)) onChange(); };
    window.addEventListener(CHANGE_EVENT, localChange);
    window.addEventListener("storage", otherTab);
    return () => { window.removeEventListener(CHANGE_EVENT, localChange); window.removeEventListener("storage", otherTab); };
  },
  toggleBookmark(anime) {
    const list = store.read("bookmark");
    const exists = list.some((a) => String(a.id) === String(anime.id));
    const next = exists ? list.filter((a) => String(a.id) !== String(anime.id)) : [{ id: anime.id, title: anime.title, image_poster: anime.image_poster, type: anime.type, status: anime.status, year: anime.year, aired_start: anime.aired_start, genre: anime.genre }, ...list];
    store.write("bookmark", next);
    return !exists;
  },
  isBookmarked(id) { return store.read("bookmark").some((a) => String(a.id) === String(id)); },
  completedEpisodeIds() {
    const ids = new Set(store.read("watched").map(historyId).filter(Boolean));
    // Include completed records from before the watched marker existed.
    for (const item of store.read("history")) if (isCompletedHistory(item) && historyId(item?.episodeId)) ids.add(historyId(item.episodeId));
    return ids;
  },
  rememberCompletedHistory(history) {
    const ids = new Set(store.read("watched").map(historyId).filter(Boolean));
    const size = ids.size;
    for (const item of history) if (isCompletedHistory(item) && historyId(item?.episodeId)) ids.add(historyId(item.episodeId));
    if (ids.size !== size) store.write("watched", [...ids]);
  },
  markWatched(episodeId) {
    const id = historyId(episodeId);
    if (!id) return;
    const ids = new Set(store.read("watched").map(historyId).filter(Boolean));
    if (!ids.has(id)) { ids.add(id); store.write("watched", [...ids]); }
  },
  removeWatched(episodeId) {
    const id = historyId(episodeId);
    if (!id) return;
    const ids = store.read("watched");
    const next = ids.filter((value) => historyId(value) !== id);
    if (next.length !== ids.length) store.write("watched", next);
  },
  pushHistory(item) {
    const id = historyId(item?.episodeId);
    if (!id) return;
    const history = store.read("history").filter((entry) => entry && typeof entry === "object");
    // Keep old completion marks before trimming the visible 60-item history.
    store.rememberCompletedHistory(history);
    const prev = history.find((entry) => historyId(entry.episodeId) === id);
    const list = history.filter((entry) => historyId(entry.episodeId) !== id);
    store.write("history", [{ ...prev, ...item, at: Date.now() }, ...list].slice(0, 60));
  },
  saveProgress(episodeId, current, duration) {
    const id = historyId(episodeId);
    if (!id || !Number.isFinite(duration) || !Number.isFinite(current) || duration <= 0 || current < 0) return;
    const history = store.read("history");
    const previous = history.find((entry) => historyId(entry?.episodeId) === id);
    // A replay must not erase an existing completion mark, including one made
    // by older versions which only saved progress equal to the duration.
    if (current >= duration || isCompletedHistory(previous)) store.markWatched(id);
    // Preserve the real duration so the displayed time matches the player;
    // never round an unfinished position up to the end of the video.
    const progress = current >= duration ? duration : Math.floor(current);
    const list = history.map((entry) =>
      historyId(entry?.episodeId) === id ? { ...entry, progress, duration } : entry
    );
    store.write("history", list);
  },
  getProgress(episodeId) {
    const id = historyId(episodeId);
    const item = id && store.read("history").find((entry) => historyId(entry?.episodeId) === id);
    return resumablePosition(item?.progress, item?.duration);
  },
  removeHistory(episodeId) {
    const id = historyId(episodeId);
    if (!id) return;
    store.write("history", store.read("history").filter((entry) => historyId(entry?.episodeId) !== id));
    store.removeWatched(id);
  },
  clearHistory() { store.write("history", []); store.write("watched", []); },
};

export function formatViews(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "jt";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "rb";
  return String(n);
}
