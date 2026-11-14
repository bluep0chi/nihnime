"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, store } from "@/lib/client";
import { isDirectVideoServer } from "@/lib/player.mjs";
import { Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenreChips, Loading, Poster, Sidebar, WidgetTitle } from "@/components/ui";

function safeMediaUrl(value) {
  try { const raw = String(value || ""); const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw); return /^(https?:)$/.test(url.protocol) ? url.href : ""; } catch { return ""; }
}
function WatchContent({ id }) {
  const queryAnimeId = useSearchParams().get("anime") || "";
  const [stream, setStream] = useState(null);
  const [anime, setAnime] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [serverIndex, setServerIndex] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);
  const lastProgress = useRef(-1);
  useEffect(() => {
    let active = true;
    setStream(null); setAnime(null); setPrevious(null); setError(""); setPlaybackError(false); lastProgress.current = -1;
    api(`/api/stream/${encodeURIComponent(id)}`).then((data) => {
      if (!active) return;
      setStream(data);
      const direct = (data.servers || []).map((server, index) => ({ server, index })).filter(({ server }) => isDirectVideoServer(server) && safeMediaUrl(server.url));
      const preferred = direct.find(({ server }) => parseInt(server.quality, 10) === 720) || direct.at(-1);
      setServerIndex(preferred?.index ?? 0);
    }).catch((e) => { if (active) setError(e.message); });
    api("/api/genres").then((data) => { if (active) setGenres(data); }).catch(() => { if (active) setGenres([]); });
    api("/api/list?mode=type&type=MOVIE&page=0").then((data) => { if (active) setMovies(data.slice(0, 4)); }).catch(() => { if (active) setMovies([]); });
    return () => { active = false; };
  }, [id, attempt]);
  const animeId = String(stream?.episode?.id_movie || queryAnimeId || "");
  useEffect(() => {
    if (!stream || !animeId) return;
    let active = true;
    api(`/api/detail/${encodeURIComponent(animeId)}`).then(async (data) => {
      if (!active) return;
      setAnime(data);
      const episodes = data.episodes || [];
      const index = episodes.findIndex((episode) => String(episode.id) === String(id));
      if (index >= 0 && episodes[index + 1]) { setPrevious(episodes[index + 1]); return; }
      const currentNumber = Number(stream.episode?.index);
      if (Number.isInteger(currentNumber) && currentNumber > 1) {
        const p = new URLSearchParams({ page: "0", search: String(currentNumber - 1) });
        const matches = await api(`/api/episodes/${encodeURIComponent(animeId)}?${p}`);
        if (active) setPrevious(matches.find((episode) => Number(episode.index) === currentNumber - 1) || null);
      }
    }).catch(() => { if (active) setAnime(null); });
    return () => { active = false; };
  }, [id, animeId, stream]);
  useEffect(() => {
    if (!stream?.episode || !animeId) return;
    store.pushHistory({ episodeId: id, animeId, animeTitle: anime?.title || stream.episode.title || "Anime", episodeIndex: stream.episode.index, image: anime?.image_poster || anime?.image_cover || null, ...(anime?.aired_start ? { aired_start: anime.aired_start } : {}) });
  }, [id, animeId, anime, stream]);
  const groups = useMemo(() => {
    const result = new Map();
    (stream?.servers || []).forEach((server, index) => {
      if (!safeMediaUrl(server.url)) return;
      const label = String(server.quality || "Lainnya");
      if (!result.has(label)) result.set(label, []);
      result.get(label).push({ server, index });
    });
    return [...result.entries()];
  }, [stream]);
  if (error) return <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!stream) return <Loading />;
  const server = stream.servers?.[serverIndex];
  const src = safeMediaUrl(server?.url);
  const title = `${anime?.title || "Anime"} ${stream.episode?.title || `Episode ${stream.episode?.index || ""}`}`.trim();
  const next = stream.episode_next?.id ? stream.episode_next : null;
  const linkEpisode = (episode) => `/episode/${encodeURIComponent(episode.id)}?anime=${encodeURIComponent(animeId)}`;
  return <><Breadcrumb items={[{ title: "Episode" }, { title }]} /><Columns><Content>{stream.demo && <DemoNotice />}<WidgetTitle title={title} /><label htmlFor="servers" className="sr-only">Pilih server video</label><select id="servers" value={serverIndex} onChange={(event) => { setPlaybackError(false); setServerIndex(Number(event.target.value)); }} disabled={!groups.length} className="bg-zinc-50 border border-zinc-300 text-zinc-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white">{groups.length ? groups.map(([quality, servers]) => <optgroup label={quality} key={quality}>{servers.map(({ server: item, index }) => <option value={index} key={`${item.server_id}-${index}`}>{item.name || "Server"} {item.quality || ""}{item.type && item.type !== "direct" ? ` (${item.type})` : ""}</option>)}</optgroup>) : <option value={0}>Server Tidak Tersedia</option>}</select><div id="video-player-wrapper" className="flex justify-center items-center aspect-video bg-zinc-300 dark:bg-zinc-700 rounded-lg overflow-hidden">{src ? isDirectVideoServer(server) ? <video key={src} id="video-player-video" className="w-full h-full" controls playsInline src={src} poster={anime?.image_cover || anime?.image_poster || undefined} onError={() => setPlaybackError(true)} onLoadedMetadata={(event) => { setPlaybackError(false); const progress = store.getProgress(id); if (progress > 0 && progress < event.currentTarget.duration) event.currentTarget.currentTime = progress; }} onTimeUpdate={(event) => { const video = event.currentTarget; const step = Math.floor(video.currentTime / 5); if (step !== lastProgress.current) { lastProgress.current = step; store.saveProgress(id, video.currentTime, video.duration); } }} /> : <iframe key={src} id="video-player-iframe" src={src} title={`Pemutar ${title}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" className="w-full h-full" /> : <h2 className="text-lg font-extrabold">Server Tidak Tersedia</h2>}</div>{playbackError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100" role="alert">Server video tidak dapat diputar dari jaringan ini. Pilih server lain jika tersedia, atau coba lagi nanti.</p>}<div className="flex flex-wrap justify-center gap-4 my-4">{previous && <Link href={linkEpisode(previous)} className="navigation-episode-item">&lt;- {previous.title || `Episode ${previous.index}`}</Link>}{animeId && <Link href={`/anime/${encodeURIComponent(animeId)}`} className="navigation-episode-item">All Eps</Link>}{next && <Link href={linkEpisode(next)} className="navigation-episode-item">{next.title || `Episode ${next.index}`} -&gt;</Link>}</div><WidgetTitle title="Link Download" /><p className="text-sm text-zinc-500">Penyedia tidak menyediakan tautan unduhan terpisah untuk episode ini.</p></Content><Sidebar><WidgetTitle title="Daftar Genre" href="/genres" />{genres.length ? <GenreChips genres={genres} className="mb-6 max-h-64 overflow-y-auto pr-1 custom-scrollbar" /> : <p className="mb-6 text-sm text-zinc-500">Genre belum tersedia.</p>}<WidgetTitle title="Anime Movie" href="/daftar?mode=type&type=MOVIE&title=Anime%20Movie" /><div className="flex flex-col gap-8 py-3">{movies.map((movie) => <div className="flex gap-4" key={movie.id}><Link href={`/anime/${encodeURIComponent(movie.id)}`}><Poster src={movie.image_poster} alt={movie.title} airedStart={movie.aired_start} className="anime3-item-img object-cover" /></Link><div className="flex flex-col gap-2"><h3 className="anime3-item-title"><Link href={`/anime/${encodeURIComponent(movie.id)}`}>{movie.title}</Link></h3><div className="text-sm line-clamp-2"><span className="font-bold">Genres : </span>{movie.genre || "-"}</div><p className="anime3-item-date">{movie.aired_start || movie.year || ""}</p></div></div>)}{!movies.length && <p className="text-sm text-zinc-500">Rekomendasi belum tersedia.</p>}</div></Sidebar></Columns></>;
}
export default function Watch({ id }) { return <Suspense fallback={<Loading />}><WatchContent id={id} /></Suspense>; }
