"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, store } from "@/lib/client";
import { SearchIcon } from "@/components/ui";

const PAGE_SIZE = 30;

function uniqueEpisodes(items, previous = []) {
  const seen = new Set(previous.map((episode) => String(episode.id)));
  return items.filter((episode) => {
    if (!episode?.id || seen.has(String(episode.id))) return false;
    seen.add(String(episode.id));
    return true;
  });
}

export default function WatchEpisodes({ animeId, currentEpisode }) {
  const [query, setQuery] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [failedMore, setFailedMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [completedIds, setCompletedIds] = useState(() => new Set());
  const requestRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const next = store.completedEpisodeIds();
      setCompletedIds((previous) => previous.size === next.size && [...previous].every((id) => next.has(id)) ? previous : next);
    };
    const unsubscribe = store.subscribe(["history", "watched"], update);
    window.addEventListener("pageshow", update);
    update();
    return () => { unsubscribe(); window.removeEventListener("pageshow", update); };
  }, []);

  useEffect(() => {
    const request = ++requestRef.current;
    const search = query.trim();
    setEpisodes([]); setPage(0); setHasMore(false); setBusy(true); setError(""); setFailedMore(false);
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ page: "0", search });
      api(`/api/episodes/${encodeURIComponent(animeId)}?${params}`).then((data) => {
        if (request !== requestRef.current) return;
        if (!Array.isArray(data)) throw new Error("Daftar episode tidak tersedia.");
        setEpisodes(uniqueEpisodes(data));
        setHasMore(data.length >= PAGE_SIZE);
      }).catch((err) => { if (request === requestRef.current) setError(err.message); })
        .finally(() => { if (request === requestRef.current) setBusy(false); });
    }, search ? 350 : 0);
    return () => { clearTimeout(timer); requestRef.current += 1; };
  }, [animeId, query, attempt]);

  async function loadMore() {
    if (busy) return;
    const request = requestRef.current;
    const nextPage = page + 1;
    setBusy(true); setError(""); setFailedMore(false);
    try {
      const params = new URLSearchParams({ page: String(nextPage), search: query.trim() });
      const data = await api(`/api/episodes/${encodeURIComponent(animeId)}?${params}`);
      if (request !== requestRef.current) return;
      if (!Array.isArray(data)) throw new Error("Daftar episode tidak tersedia.");
      setEpisodes((previous) => [...previous, ...uniqueEpisodes(data, previous)]);
      setPage(nextPage); setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      if (request === requestRef.current) { setError(err.message); setFailedMore(true); }
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  }

  const currentId = String(currentEpisode?.id || "");
  const pinned = !query.trim() && currentId && !episodes.some((episode) => String(episode.id) === currentId) ? currentEpisode : null;
  const visible = pinned ? [pinned, ...episodes] : episodes;
  return <section id="daftar-episode" className="watch-episodes" aria-labelledby="watch-episodes-title">
    <div className="watch-episodes-heading"><h2 id="watch-episodes-title">Daftar Episode</h2><span>{pinned ? "Episode saat ini di atas" : "Terbaru lebih dulu"}</span></div>
    <div className="watch-episodes-search">
      <SearchIcon className="watch-episodes-search-icon" />
      <label htmlFor="watch-episode-search" className="sr-only">Cari episode</label>
      <input id="watch-episode-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nomor atau judul episode..." />
    </div>
    {error && <p className="watch-episodes-error" role="alert">{error} <button type="button" onClick={() => failedMore ? loadMore() : setAttempt((value) => value + 1)}>Coba lagi</button></p>}
    {visible.length > 0 && <ul className="watch-episodes-grid custom-scrollbar" aria-busy={busy} tabIndex={0}>
      {visible.map((episode) => {
        const selected = String(episode.id) === currentId;
        const finished = completedIds.has(String(episode.id));
        const title = episode.title || `Episode ${episode.index || ""}`;
        return <li key={String(episode.id)}><Link href={`/episode/${encodeURIComponent(episode.id)}?anime=${encodeURIComponent(animeId)}`} prefetch={false} className={`watch-episode-option${selected ? " is-current" : ""}`} aria-current={selected ? "page" : undefined} title={title}><span>{title}</span>{(finished || selected) && <span className={`watch-episode-status${finished && selected ? " has-both" : ""}`}>{finished && <small className="watch-episode-finished" role="img" aria-label="Episode selesai" title="Episode selesai">✓</small>}{selected && <small>Diputar</small>}</span>}</Link></li>;
      })}
    </ul>}
    {busy && <p className="watch-episodes-message" role="status">Memuat episode...</p>}
    {!busy && !error && !episodes.length && <p className="watch-episodes-message">{query.trim() ? "Episode tidak ditemukan." : pinned ? "Episode lain belum tersedia." : "Episode belum tersedia."}</p>}
    {hasMore && !error && <button type="button" onClick={loadMore} disabled={busy} className="watch-episodes-more">Muat episode lainnya</button>}
  </section>;
}
