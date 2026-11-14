"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, store } from "@/lib/client";
import { availableEpisodeCount, dayLabel, episodeChoices, hasText, statusLabel } from "@/lib/display.mjs";
import { Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenreSidebar, Loading, PlayIcon, Poster, PosterGrid, SearchIcon, WidgetTitle } from "@/components/ui";

const episodeHref = (episode, animeId) => `/episode/${encodeURIComponent(episode.id)}?anime=${encodeURIComponent(animeId)}`;
const listHref = (mode, key, value, title) => `/daftar?mode=${mode}&${key}=${encodeURIComponent(value)}&title=${encodeURIComponent(title)}`;
const linkClass = "text-blue-600 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-200";

function DetailRows({ anime, genres }) {
  const names = String(anime.genre || "").split(",").map((value) => value.trim()).filter(hasText);
  const studios = String(anime.studio || "").split(",").map((value) => value.trim()).filter(hasText);
  const count = availableEpisodeCount(anime);
  const rows = [];
  if (hasText(anime.synonyms)) rows.push(["Judul lain", anime.synonyms]);
  if (statusLabel(anime.status)) rows.push(["Status", statusLabel(anime.status)]);
  if (hasText(anime.type)) rows.push(["Tipe", <Link className={linkClass} href={listHref("type", "type", anime.type, `Tipe: ${anime.type}`)}>{anime.type}</Link>]);
  if (count !== null) rows.push(["Episode tersedia", count]);
  if (studios.length) rows.push(["Studio", <>{studios.map((studio, index) => <span key={`${studio}-${index}`}>{index > 0 && ", "}<Link className={linkClass} href={listHref("studio", "studio", studio, `Studio: ${studio}`)}>{studio}</Link></span>)}</>]);
  if (hasText(anime.season)) rows.push(["Season", anime.season]);
  if (names.length) rows.push(["Genre", <>{names.map((name, index) => {
    const genre = genres.find((g) => g.name.toLowerCase() === name.toLowerCase());
    return <span key={`${name}-${index}`}>{index > 0 && ", "}{genre ? <Link className={linkClass} href={`/genres/${encodeURIComponent(genre.id)}?name=${encodeURIComponent(genre.name)}`}>{name}</Link> : name}</span>;
  })}</>]);
  if (hasText(anime.aired_start) || hasText(anime.aired_end)) rows.push(["Tayang", [anime.aired_start, anime.aired_end].filter(hasText).join(" – ")]);
  if (hasText(anime.day) && String(anime.day).toUpperCase() !== "RANDOM") rows.push(["Hari", <Link className={linkClass} href={`/schedule?day=${encodeURIComponent(String(anime.day).toUpperCase())}`}>{dayLabel(String(anime.day).toUpperCase())}</Link>]);
  if (Number(anime.views) > 0) rows.push(["Penayangan", Number(anime.views).toLocaleString("id-ID")]);
  if (Number(anime.favorites) > 0) rows.push(["Favorit", Number(anime.favorites).toLocaleString("id-ID")]);
  if (!rows.length) return <p className="text-sm text-zinc-500">Detail belum tersedia.</p>;
  const split = Math.ceil(rows.length / 2);
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 py-4">{[rows.slice(0, split), rows.slice(split)].map((column, index) => <div key={index} className="grid grid-cols-[minmax(7rem,40%)_1fr] gap-2 border-l border-l-zinc-400 dark:border-l-zinc-600 px-3 h-max">{column.map(([label, value]) => <div key={label} className="contents"><span>{label}</span><span className="min-w-0 break-words">: {value}</span></div>)}</div>)}</div>;
}

export default function AnimeDetail({ id }) {
  const [anime, setAnime] = useState(null);
  const [genres, setGenres] = useState([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [episodeError, setEpisodeError] = useState("");
  const [episodeAttempt, setEpisodeAttempt] = useState(0);
  const episodeRequest = useRef(0);

  useEffect(() => {
    let active = true;
    setAnime(null); setError(""); setQuery("");
    api(`/api/detail/${encodeURIComponent(id)}`).then((data) => {
      if (!active) return;
      setAnime(data); setSaved(store.isBookmarked(data.id));
    }).catch((e) => { if (active) setError(e.message); });
    api("/api/genres").then((data) => { if (active) setGenres(data); }).catch(() => { if (active) setGenres([]); });
    return () => { active = false; };
  }, [id, attempt]);

  useEffect(() => {
    if (!anime) return;
    const request = ++episodeRequest.current;
    const search = query.trim();
    setPage(0); setBusy(false);
    if (!search && episodeAttempt === 0) {
      setEpisodes(anime.episodes || []); setHasMore((anime.episodes || []).length >= 30); setEpisodeError(anime.episodes_error || "");
      return;
    }
    setBusy(true); setEpisodeError("");
    const timer = setTimeout(() => {
      const p = new URLSearchParams({ page: "0", search });
      api(`/api/episodes/${encodeURIComponent(id)}?${p}`).then((data) => {
        if (request !== episodeRequest.current) return;
        setEpisodes(data); setHasMore(data.length >= 30);
      }).catch((e) => { if (request === episodeRequest.current) { setEpisodes([]); setHasMore(false); setEpisodeError(e.message); } }).finally(() => { if (request === episodeRequest.current) setBusy(false); });
    }, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [anime, id, query, episodeAttempt]);

  async function loadMore() {
    const request = episodeRequest.current;
    setBusy(true); setEpisodeError("");
    try {
      const nextPage = page + 1;
      const p = new URLSearchParams({ page: String(nextPage), search: query.trim() });
      const next = await api(`/api/episodes/${encodeURIComponent(id)}?${p}`);
      if (request !== episodeRequest.current) return;
      setEpisodes((previous) => { const seen = new Set(previous.map((episode) => String(episode.id))); return [...previous, ...next.filter((episode) => !seen.has(String(episode.id)))]; });
      setPage(nextPage); setHasMore(next.length >= 30);
    } catch (e) { if (request === episodeRequest.current) setEpisodeError(e.message); }
    finally { if (request === episodeRequest.current) setBusy(false); }
  }
  if (error) return <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!anime) return <Loading />;
  const { first, latest } = episodeChoices(anime);
  const related = (anime.seasons || []).filter((item) => String(item.id) !== String(anime.id));
  const summary = [statusLabel(anime.status), hasText(anime.type) ? anime.type : ""].filter(Boolean).join(" | ");
  return <><Breadcrumb items={[{ title: "Anime", href: "/anime" }, { title: anime.title }]} /><Columns><Content>{anime.demo && <DemoNotice />}<div className="relative"><Poster src={anime.image_cover || anime.image_poster} className="w-full aspect-[16/6] object-cover rounded-t-md" alt={anime.title} airedStart={anime.aired_start} kind="cover" loading="eager" /><div className="absolute inset-0 rounded-t-md bg-gradient-to-t from-zinc-100 dark:from-zinc-900 to-transparent" /></div><div className="flex flex-col sm:flex-row justify-center items-center sm:justify-start gap-4 sm:items-end xs:-mt-[100px] sm:-mt-[150px] relative p-4"><Poster src={anime.image_poster} alt={anime.title} airedStart={anime.aired_start} className="w-[150px] sm:w-[170px] md:w-[200px] rounded-md aspect-[3/4] object-cover" loading="eager" /><div className="flex flex-col gap-3 items-center text-center sm:items-start sm:text-left"><h1 className="text-xl md:text-2xl font-extrabold line-clamp-2">{anime.title}</h1>{summary && <p>{summary}</p>}<div className="flex flex-wrap justify-center gap-2">{first && <Link href={episodeHref(first, anime.id)} title={first.title || "Tonton episode"} className="flex gap-1 items-center text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-4 focus:ring-amber-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-amber-600 dark:hover:bg-amber-700"><PlayIcon />Tonton</Link>}{latest && String(latest.id) !== String(first?.id) && <Link href={episodeHref(latest, anime.id)} className="flex gap-1 items-center border border-sky-700 text-sky-700 hover:bg-sky-700 hover:text-white font-medium rounded-full text-sm px-5 py-2.5 dark:border-sky-500 dark:text-sky-400 dark:hover:text-white">Episode Terbaru</Link>}<button type="button" onClick={() => setSaved(store.toggleBookmark(anime))} className="flex gap-1 items-center border border-amber-700 text-amber-700 hover:bg-amber-700 hover:text-white font-medium rounded-full text-sm px-5 py-2.5 dark:border-amber-500 dark:text-amber-500 dark:hover:text-white" aria-pressed={saved}>{saved ? "Tersimpan ✓" : "Bookmark"}</button></div></div></div>{hasText(anime.synopsis) ? <div className="flex flex-col gap-3">{String(anime.synopsis).split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index} className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{paragraph}</p>)}</div> : <p className="text-sm text-zinc-500">Sinopsis belum tersedia.</p>}<WidgetTitle title="Detail Anime" /><DetailRows anime={anime} genres={genres} />{related.length > 0 && <><WidgetTitle title="Season / Sekuel Terkait" /><PosterGrid items={related} showSeason /></>}<WidgetTitle title="Daftar Episode" /><p className="text-sm text-zinc-500">Episode terbaru ditampilkan terlebih dahulu. Cari nomor episode atau muat episode lainnya.</p><div className="relative"><SearchIcon className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" /><label className="sr-only" htmlFor="episode-search">Cari nomor episode</label><input id="episode-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nomor episode..." className="block w-full p-3 ps-10 text-sm text-zinc-900 border border-zinc-300 rounded-lg bg-zinc-50 focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-700 dark:border-zinc-600 dark:placeholder-zinc-400 dark:text-white" /></div>{episodeError && <p className="text-sm text-red-700 dark:text-red-400" role="alert">{episodeError} <button type="button" onClick={() => setEpisodeAttempt((n) => n + 1)} className="underline">Coba lagi</button></p>}<div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto custom-scrollbar">{episodes.map((episode) => <Link key={episode.id} href={episodeHref(episode, anime.id)} className="flex gap-4 items-center hover:bg-zinc-300 dark:hover:bg-zinc-700 p-2 rounded-md"><div className="text-white py-2 px-4 bg-sky-700 dark:bg-sky-600 rounded-sm shrink-0 max-w-[45%] break-words">{episode.title || `Episode ${episode.index}`}</div><div className="min-w-0"><div className="line-clamp-1">{anime.title}</div><div className="flex flex-wrap gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">{hasText(episode.key_time) && <span>{episode.key_time}</span>}{String(episode.is_new) === "1" && <span className="text-amber-700 dark:text-amber-400">Baru</span>}</div></div></Link>)}{!busy && !episodes.length && !episodeError && <p className="text-sm text-zinc-500">{query.trim() ? "Episode tidak ditemukan." : "Episode belum tersedia."}</p>}</div>{busy && <p className="text-sm text-zinc-500" role="status">Memuat episode...</p>}{hasMore && <button type="button" onClick={loadMore} disabled={busy} className="pagination-item self-center disabled:opacity-50">Muat episode lainnya</button>}</Content><GenreSidebar genres={genres} /></Columns></>;
}
