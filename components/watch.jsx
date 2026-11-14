"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, store } from "@/lib/client";
import { isDirectVideoServer, preferredServerIndex, safeMediaUrl } from "@/lib/player.mjs";
import VideoPlayer from "@/components/video-player";
import WatchEpisodes from "@/components/watch-episodes";
import WatchIcon from "@/components/watch-icon";
import { Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenreChips, Loading, Poster, Sidebar, WidgetTitle } from "@/components/ui";

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
  const [playerAttempt, setPlayerAttempt] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    let active = true;
    setStream(null); setAnime(null); setPrevious(null); setError(""); setPlaybackError(false); setPlayerAttempt(0);
    api(`/api/stream/${encodeURIComponent(id)}`).then((data) => {
      if (!active) return;
      if (String(data?.episode?.id) !== String(id)) { setError("Data episode tidak cocok. Silakan coba lagi."); return; }
      setStream(data);
      setServerIndex(preferredServerIndex(data.servers || []));
    }).catch((e) => { if (active) setError(e.message); });
    api("/api/genres").then((data) => { if (active) setGenres(data); }).catch(() => { if (active) setGenres([]); });
    api("/api/list?mode=type&type=MOVIE&page=0").then((data) => { if (active) setMovies(data.slice(0, 4)); }).catch(() => { if (active) setMovies([]); });
    return () => { active = false; };
  }, [id, attempt]);
  const currentStream = stream && String(stream.episode?.id) === String(id);
  const animeId = currentStream ? String(stream?.episode?.id_movie || queryAnimeId || "") : "";
  useEffect(() => {
    if (!currentStream || !animeId) return;
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
        try {
          const matches = await api(`/api/episodes/${encodeURIComponent(animeId)}?${p}`);
          if (active) setPrevious(matches.find((episode) => Number(episode.index) === currentNumber - 1) || null);
        } catch { if (active) setPrevious(null); }
      }
    }).catch(() => { if (active) setAnime(null); });
    return () => { active = false; };
  }, [id, animeId, stream, currentStream]);
  useEffect(() => {
    if (!currentStream || !stream?.episode || !animeId) return;
    store.pushHistory({ episodeId: id, animeId, animeTitle: anime?.title || stream.episode.title || "Anime", episodeIndex: stream.episode.index, image: anime?.image_poster || anime?.image_cover || null, ...(anime?.aired_start ? { aired_start: anime.aired_start } : {}) });
  }, [id, animeId, anime, stream, currentStream]);
  const groups = useMemo(() => {
    const result = new Map();
    (stream?.servers || []).forEach((server, index) => {
      if (!safeMediaUrl(server?.url)) return;
      const label = String(server.quality || "Lainnya");
      if (!result.has(label)) result.set(label, []);
      result.get(label).push({ server, index });
    });
    return [...result.entries()];
  }, [stream]);
  if (error) return <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!currentStream) return <Loading />;
  const server = stream.servers?.[serverIndex];
  const src = safeMediaUrl(server?.url);
  const direct = isDirectVideoServer(server);
  const title = `${anime?.title || "Anime"} ${stream.episode?.title || `Episode ${stream.episode?.index || ""}`}`.trim();
  const next = stream.episode_next?.id ? stream.episode_next : null;
  const linkEpisode = (episode) => `/episode/${encodeURIComponent(episode.id)}?anime=${encodeURIComponent(animeId)}`;
  const playerKey = `${id}-${serverIndex}-${src}-${playerAttempt}`;

  return <><Breadcrumb items={[{ title: "Episode" }, { title }]} /><Columns><Content>
    {stream.demo && <DemoNotice />}
    <header className="watch-heading"><h1>{title}</h1></header>

    <div className="watch-server-panel">
      <label htmlFor="servers" className="watch-server-label">
        <span className="watch-server-icon"><WatchIcon name="server" /></span>
        <span><strong>Pilih server & kualitas</strong><small>Ganti sumber jika video bermasalah</small></span>
      </label>
      <div className="watch-select-wrap">
        <select id="servers" value={serverIndex} onChange={(event) => { setPlaybackError(false); setServerIndex(Number(event.target.value)); }} disabled={!groups.length}>
          {groups.length ? groups.map(([quality, servers]) => <optgroup label={quality} key={quality}>{servers.map(({ server: item, index }) => <option value={index} key={`${item.server_id}-${index}`}>{item.name || "Server"} {item.quality || ""} — {isDirectVideoServer(item) ? "Video langsung" : "Embed"}</option>)}</optgroup>) : <option value={0}>Server Tidak Tersedia</option>}
        </select>
        <WatchIcon name="chevron" className="watch-select-arrow" />
      </div>
    </div>

    {src && direct ? <VideoPlayer key={playerKey} src={src} poster={anime?.image_cover || anime?.image_poster} title={title} serverLabel={`${server?.name || "Server"} ${server?.quality || ""}`.trim()} episodeId={id} animeId={stream.episode?.id_movie || ""} episodeNumber={stream.episode?.index} demo={Boolean(stream.demo)} onError={() => setPlaybackError(true)} onReady={() => setPlaybackError(false)} /> : <div id="video-player-wrapper" className="watch-external-player">{src ? <iframe key={playerKey} id="video-player-iframe" src={src} title={`Pemutar ${title}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="no-referrer" /> : <div className="watch-empty-player"><WatchIcon name="warning" /><strong>Server Tidak Tersedia</strong></div>}</div>}

    {playbackError && <div className="watch-alert" role="alert"><WatchIcon name="warning" /><div>Server video tidak dapat diputar dari jaringan ini. Pilih server lain jika tersedia, atau coba lagi nanti. <button type="button" onClick={() => { setPlaybackError(false); setPlayerAttempt((n) => n + 1); }}><WatchIcon name="reload" /> Muat ulang pemutar</button></div></div>}
    {src && !direct && <div className="watch-embed-note"><WatchIcon name="info" /><p>Pemutar embed berasal dari pihak ketiga; progres dan lewati intro tidak dapat dikendalikan NIHNIME. Jika video tidak muncul, coba server atau kualitas lain.</p></div>}

    <nav className={`watch-episode-nav${previous && next ? " has-both" : ""}`} aria-label="Navigasi episode">
      {previous && <Link href={linkEpisode(previous)} className="watch-episode-link" aria-label={`Episode sebelumnya: ${previous.title || `Episode ${previous.index}`}`}><WatchIcon name="previous" /><span><small>Sebelumnya</small><strong>{previous.title || `Episode ${previous.index}`}</strong></span></Link>}
      {animeId && <a href="#daftar-episode" className="watch-episode-link watch-episode-all" aria-label="Semua Episode"><WatchIcon name="episodes" /><span><small>Semua</small><strong>Episode</strong></span></a>}
      {next && <Link href={linkEpisode(next)} className="watch-episode-link watch-episode-next" aria-label={`Episode selanjutnya: ${next.title || `Episode ${next.index}`}`}><span><small>Selanjutnya</small><strong>{next.title || `Episode ${next.index}`}</strong></span><WatchIcon name="next" /></Link>}
    </nav>
    {animeId && <WatchEpisodes key={animeId} animeId={animeId} currentEpisode={stream.episode} />}
    <p className="watch-credit-text">Dihadirkan oleh <Link href="/">NIHNIME</Link>.</p>
  </Content><Sidebar><WidgetTitle title="Daftar Genre" href="/genres" />{genres.length ? <GenreChips genres={genres} className="mb-6 max-h-64 overflow-y-auto pr-1 custom-scrollbar" /> : <p className="mb-6 text-sm text-zinc-500">Genre belum tersedia.</p>}<WidgetTitle title="Anime Movie" href="/daftar?mode=type&type=MOVIE&title=Anime%20Movie" /><div className="flex flex-col gap-8 py-3">{movies.map((movie) => <div className="flex gap-4" key={movie.id}><Link href={`/anime/${encodeURIComponent(movie.id)}`}><Poster src={movie.image_poster} alt={movie.title} airedStart={movie.aired_start} className="anime3-item-img object-cover" /></Link><div className="flex min-w-0 flex-col gap-2"><h3 className="anime3-item-title [overflow-wrap:anywhere]"><Link href={`/anime/${encodeURIComponent(movie.id)}`}>{movie.title}</Link></h3>{movie.genre && movie.genre !== "-" && <div className="text-sm line-clamp-2 [overflow-wrap:anywhere]"><span className="font-bold">Genres : </span>{movie.genre}</div>}{movie.aired_start && <p className="anime3-item-date">{movie.aired_start}</p>}</div></div>)}{!movies.length && <p className="text-sm text-zinc-500">Rekomendasi belum tersedia.</p>}</div></Sidebar></Columns></>;
}
export default function Watch({ id }) { return <Suspense fallback={<Loading />}><WatchContent id={id} /></Suspense>; }
