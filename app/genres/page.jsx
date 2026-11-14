"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenericSidebar, Loading, WidgetTitle } from "@/components/ui";

export default function Page() {
  const [genres, setGenres] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setGenres(null); setError("");
    api("/api/genres").then((value) => { if (active) setGenres(value); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [attempt]);
  return <><Breadcrumb items={[{ title: "Genres" }]} /><Columns><Content><WidgetTitle title="Daftar Genre" />{error ? <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} /> : genres === null ? <Loading /> : <>{genres.some((genre) => genre.demo) && <DemoNotice />}<div className="gap-2 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5">{genres.map((genre) => <Link key={genre.id} href={`/genres/${encodeURIComponent(genre.id)}?name=${encodeURIComponent(genre.name)}`} className="genre-item line-clamp-1">{genre.name}</Link>)}</div>{!genres.length && <p className="text-sm text-zinc-500">Genre belum tersedia.</p>}</>}</Content><GenericSidebar /></Columns></>;
}
