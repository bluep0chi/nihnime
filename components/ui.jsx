"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const DONATION_URL = "https://sociabuzz.com/molinime/tribe";
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const alphabetItems = ["0-9", ...ALPHABET];

export function PlayIcon() {
  return <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M8.6 5.2A1 1 0 0 0 7 6v12a1 1 0 0 0 1.6.8l8-6a1 1 0 0 0 0-1.6l-8-6Z" /></svg>;
}
export function SearchIcon({ className = "w-5 h-5" }) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>;
}
export function StarIcon() {
  return <svg className="w-3 h-3" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.476l-4.552-.361-1.754-4.167Z" /></svg>;
}

export function Breadcrumb({ items = [] }) {
  return <header className="flex p-3 border border-zinc-300 rounded-lg bg-white dark:bg-zinc-900 dark:border-zinc-800" aria-label="Breadcrumb">
    <ol className="inline-flex min-w-0 items-center space-x-1 md:space-x-2">
      <li className="inline-flex items-center"><Link href="/" className="inline-flex items-center text-sm font-medium hover:text-amber-600"><svg className="w-3 h-3 me-2.5" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor"><path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" /></svg>Home</Link></li>
      {items.map((item, index) => <li key={`${item.title}-${index}`} className="min-w-0" aria-current={index === items.length - 1 ? "page" : undefined}><div className="flex items-center"><svg className="w-3 h-3 mx-1 shrink-0 text-zinc-400" aria-hidden="true" viewBox="0 0 6 10" fill="none"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" /></svg>{item.href && index !== items.length - 1 ? <Link href={item.href} className="ms-1 text-sm font-medium hover:text-amber-600 md:ms-2">{item.title}</Link> : <span className="ms-1 text-sm font-medium text-zinc-500 md:ms-2 line-clamp-1">{item.title}</span>}</div></li>)}
    </ol>
  </header>;
}

export function Columns({ children }) { return <div className="flex flex-col lg:flex-row gap-4">{children}</div>; }
export function Content({ children }) { return <div className="min-w-0 flex flex-col gap-4 border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-3 md:flex-[3]">{children}</div>; }
export function Sidebar({ children }) { return <aside className="min-w-0 flex flex-col border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-4 rounded-lg p-3 md:flex-1">{children}</aside>; }
export function WidgetTitle({ title, href }) {
  return <><div className="flex justify-between gap-4 flex-wrap"><h2 className="text-lg font-bold line-clamp-2">{title}</h2>{href && <Link href={href} className="text-white bg-amber-700 hover:bg-amber-800 focus:ring-4 focus:outline-none focus:ring-amber-300 font-medium rounded-lg text-xs px-3 py-2 text-center inline-flex items-center dark:bg-amber-600 dark:hover:bg-amber-700">More<svg className="w-3.5 h-3.5 ms-2" aria-hidden="true" viewBox="0 0 14 10" fill="none"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" /></svg></Link>}</div><hr className="border-zinc-400 dark:border-zinc-600" /></>;
}

export const chipClass = "text-xs font-medium px-2.5 py-1.5 rounded bg-zinc-200 text-zinc-800 hover:bg-amber-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-amber-600 transition-colors";
export function GenreChips({ genres = [], className = "" }) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{genres.map((g) => <Link key={g.id} href={`/genres/${encodeURIComponent(g.id)}?name=${encodeURIComponent(g.name)}`} className={chipClass}>{g.name}</Link>)}</div>;
}
export function AlphabetChips({ current }) {
  return <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">{alphabetItems.map((item) => <Link key={item} href={`/az-list/${item}`} aria-current={item === current ? "page" : undefined} className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded hover:bg-sky-600 hover:text-white transition-colors ${item === current ? "bg-sky-700 text-white" : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-sky-600"}`}>{item}</Link>)}</div>;
}
export function GenericSidebar() { return <Sidebar><WidgetTitle title="Sidebar" /></Sidebar>; }
export function GenreSidebar({ genres = [] }) { return <Sidebar><WidgetTitle title="Daftar Genre" href="/genres" />{genres.length ? <GenreChips genres={genres} className="mb-6 max-h-64 overflow-y-auto pr-1 custom-scrollbar" /> : <p className="text-sm text-zinc-500">Genre belum tersedia.</p>}<WidgetTitle title="Sidebar" /></Sidebar>; }

export function Poster({ src, alt, className, loading = "lazy" }) {
  return <img src={src || "/images/nihnime.jpg"} alt={alt || ""} loading={loading} className={className} onError={(event) => { if (!event.currentTarget.src.endsWith("/images/nihnime.jpg")) event.currentTarget.src = "/images/nihnime.jpg"; }} />;
}
function episodeLabel(anime) {
  if (anime.label) return anime.label;
  if (anime.latest_episode) return String(anime.latest_episode).replace(/^Episode\s*/i, "Ep ");
  if (anime.episodeIndex != null) return `Ep ${anime.episodeIndex}`;
  return "Episode";
}
export function SquareGrid({ items, completed = false, history = false }) {
  return <div className="py-3 gap-4 grid xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4">{items.map((anime, index) => {
    const href = history ? `/episode/${encodeURIComponent(anime.episodeId)}?anime=${encodeURIComponent(anime.animeId || "")}` : completed ? `/anime/${encodeURIComponent(anime.id)}` : `/episode/latest/${encodeURIComponent(anime.id)}`;
    return <Link href={href} key={`${anime.id || anime.episodeId}-${index}`} className="group relative"><div className="relative overflow-hidden rounded-lg"><Poster className="anime1-item-img" src={history ? anime.image : anime.image_poster || anime.image_cover} alt={history ? anime.animeTitle : anime.title} /><span className="anime1-item-eps">{history ? episodeLabel(anime) : completed ? "Ep END" : episodeLabel(anime)}</span></div><div className="p-2"><h3 className="anime1-item-title">{history ? anime.animeTitle : anime.title}</h3>{history && anime.at && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">{new Date(anime.at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>}</div></Link>;
  })}</div>;
}
export function PosterGrid({ items, schedule = false }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{items.map((anime, index) => <Link key={`${anime.id}-${index}`} href={`/anime/${encodeURIComponent(anime.id)}`} className="group rounded-lg relative"><div className="relative"><Poster className="anime2-item-img" src={anime.image_poster || anime.image_cover} alt={anime.title} /><span className="anime2-item-type">{anime.type || "ANIME"}</span><span className="anime2-item-score"><StarIcon /><span>{anime.score || "N/A"}</span></span><span className="anime2-item-status">{schedule ? (anime.time || anime.status || "-") : (anime.status || "-")}</span></div><div className="p-2"><h3 className="anime2-item-title">{anime.title}</h3></div></Link>)}</div>;
}

export function Carousel({ items }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => setCurrent((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [items.length]);
  if (!items.length) return null;
  const anime = items[current % items.length];
  return <div id="controls-carousel" className="relative w-full" aria-label="Episode pilihan"><div className="relative h-56 overflow-hidden rounded-md md:h-96"><div className="carousel-item" key={anime.id}><Poster loading="eager" src={anime.image_cover || anime.image_poster} className="carousel-item-image" alt={anime.title} /><div className="carousel-item-layer"><div className="carousel-item-cus"><p className="carousel-item-eps"><span className="text-teal-600">{anime.latest_episode || "Episode Terbaru"}</span></p><h1 className="carousel-item-title">{anime.title}</h1><Link href={`/episode/latest/${encodeURIComponent(anime.id)}`} className="carousel-item-btn"><PlayIcon /><span className="text-xs">Tonton Kuy</span></Link></div></div></div></div>{items.length > 1 && <div className="absolute z-30 flex md:gap-10 -translate-x-1/2 space-x-3 bottom-5 left-1/2">{[-1, 1].map((step) => <button key={step} type="button" onClick={() => setCurrent((i) => (i + step + items.length) % items.length)} className="flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" aria-label={step < 0 ? "Sebelumnya" : "Berikutnya"}><span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/30 group-hover:bg-white/50 group-focus:ring-4 group-focus:ring-zinc-600 dark:bg-zinc-800/30 dark:group-hover:bg-zinc-800/50 dark:group-focus:ring-zinc-500"><svg className="w-4 h-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" viewBox="0 0 6 10" fill="none"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step < 0 ? "M5 1 1 5l4 4" : "m1 9 4-4-4-4"} /></svg></span></button>)}</div>}</div>;
}

export function Loading({ label = "Memuat data..." }) { return <div className="flex items-center justify-center gap-3 min-h-48 text-sm text-zinc-500" role="status"><span className="loader" aria-hidden="true" /><span>{label}</span></div>; }
export function ErrorBox({ message, onRetry }) { return <div className="flex flex-col items-center justify-center text-center gap-3 py-12" role="alert"><h1 className="text-xl font-extrabold">Gagal memuat data</h1><p className="text-zinc-600 dark:text-zinc-400">{message || "Terjadi kesalahan. Silakan coba lagi."}</p>{onRetry && <button type="button" onClick={onRetry} className="pagination-item">Coba lagi</button>}<Link href="/" className="text-sky-700 dark:text-sky-400">Kembali ke halaman utama</Link></div>; }
export function DemoNotice() { return <p className="text-sm rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100" role="status">Mode demo aktif: data dan video berikut adalah contoh, bukan data AnimeIn terkini.</p>; }
export function Pagination({ page, hasNext, onPage }) { return <nav aria-label="Halaman" className="flex justify-center gap-2 flex-wrap">{page > 0 && <button type="button" className="pagination-item" onClick={() => onPage(page - 1)} aria-label="Halaman sebelumnya">&lt;-</button>}<span className="pagination-item active" aria-current="page">{page + 1}</span>{hasNext && <button type="button" className="pagination-item" onClick={() => onPage(page + 1)} aria-label="Halaman berikutnya">-&gt;</button>}</nav>; }
