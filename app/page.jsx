"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { HOME_SECTIONS } from "@/lib/sections.mjs";
import { AlphabetChips, Breadcrumb, BrowseLinks, Carousel, Columns, Content, DemoNotice, ErrorBox, GenreChips, Loading, PosterGrid, Sidebar, SquareGrid, WidgetTitle, chipClass } from "@/components/ui";

export default function HomePage() {
  const [data, setData] = useState(null);
  const [genres, setGenres] = useState(null);
  const [years, setYears] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError(""); setGenres(null); setYears(null);
    api("/api/home").then((result) => { if (active) setData(result); }).catch((e) => { if (active) setError(e.message); });
    api("/api/genres").then((result) => { if (active) setGenres(result); }).catch(() => { if (active) setGenres([]); });
    api("/api/years").then((result) => { if (active) setYears(result); }).catch(() => { if (active) setYears([]); });
    return () => { active = false; };
  }, [attempt]);
  if (error) return <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!data) return <Loading />;
  const recent = (data.episode_baru || []).slice(0, 8);
  const seen = new Set();
  const completed = [...(data.paling_populer || []), ...(data.sedang_hangat || []), ...(data.judul_baru || [])].filter((anime) => {
    if (!/^(FINISHED|COMPLETED|END)$/i.test(String(anime.status || "")) || seen.has(String(anime.id))) return false;
    seen.add(String(anime.id));
    return true;
  }).slice(0, 8);
  return <>
    {data.demo && <DemoNotice />}
    <Carousel items={recent.slice(0, 5)} />
    <Breadcrumb />
    <Columns><Content><WidgetTitle title="Episode Terbaru" href="/recent" />{recent.length ? <SquareGrid items={recent} /> : <p className="text-sm text-zinc-500">Belum ada episode terbaru.</p>}<WidgetTitle title="Anime Selesai" href="/completed" />{completed.length ? <SquareGrid items={completed} completed /> : <p className="text-sm text-zinc-500">Belum ada anime selesai yang ditampilkan.</p>}{Object.entries(HOME_SECTIONS).map(([slug, { title, key }]) => data[key]?.length ? <div key={key} className="flex flex-col gap-4"><WidgetTitle title={title} href={`/pilihan/${slug}`} /><PosterGrid items={data[key].slice(0, 4)} /></div> : null)}</Content><Sidebar><WidgetTitle title="Tahun" href="/jelajahi" /><div className="flex flex-wrap gap-2 mb-6 max-h-60 overflow-y-auto pr-1 custom-scrollbar">{years === null ? <span className="text-sm text-zinc-500">Memuat...</span> : years.length ? years.map((year) => <Link key={year.name} href={`/daftar?mode=year&year=${encodeURIComponent(year.name)}&title=${encodeURIComponent(`Tahun ${year.name}`)}`} className={chipClass}>{year.name === "UNKNOWN" ? "Tidak diketahui" : year.name}</Link>) : <span className="text-sm text-zinc-500">Tahun tidak tersedia.</span>}</div><WidgetTitle title="Daftar Genre" href="/genres" />{genres === null ? <p className="mb-6 text-sm text-zinc-500">Memuat...</p> : genres.length ? <GenreChips genres={genres} className="mb-6 max-h-60 overflow-y-auto pr-1 custom-scrollbar" /> : <p className="mb-6 text-sm text-zinc-500">Genre tidak tersedia.</p>}<WidgetTitle title="A-Z List" /><AlphabetChips /><WidgetTitle title="Jelajahi" /><BrowseLinks /></Sidebar></Columns>
  </>;
}
