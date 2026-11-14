"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { groupGenres, sortYears } from "@/lib/display.mjs";
import { Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenericSidebar, GenreChips, Loading, WidgetTitle, chipClass } from "@/components/ui";

export default function Page() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError("");
    api("/api/explore").then((value) => { if (active) setData(value); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [attempt]);
  return <><Breadcrumb items={[{ title: "Jelajahi" }]} /><Columns><Content><WidgetTitle title="Jelajahi Anime" />{error ? <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} /> : !data ? <Loading /> : <>{data.genre?.some((item) => item.demo) && <DemoNotice />}<WidgetTitle title="Genre, Tema & Demografi" href="/genres" />{groupGenres(data.genre || []).map(({ label, items }) => <div key={label} className="flex flex-col gap-2"><h3 className="text-sm font-bold">{label}</h3><GenreChips genres={items} /></div>)}{!data.genre?.length && <p className="text-sm text-zinc-500">Kategori belum tersedia.</p>}<WidgetTitle title="Tahun / Season" /><p className="text-sm text-zinc-500">Tahun mengikuti kategori penyedia dan belum tentu tahun mulai tayang.</p><div className="flex flex-wrap gap-2">{sortYears(data.tahun || []).map((item) => <Link key={item.name} href={`/daftar?mode=year&year=${encodeURIComponent(item.name)}&title=${encodeURIComponent(`Tahun ${item.name}`)}`} className={chipClass}>{item.name === "UNKNOWN" ? "Tidak diketahui" : item.name}</Link>)}{!data.tahun?.length && <span className="text-sm text-zinc-500">Tahun belum tersedia.</span>}</div><WidgetTitle title="Tipe" /><div className="flex flex-wrap gap-2">{(data.tipe || []).map((item) => <Link key={item.id || item.name} href={`/daftar?mode=type&type=${encodeURIComponent(item.name)}&title=${encodeURIComponent(`Tipe: ${item.name}`)}`} className={chipClass}>{item.name}</Link>)}{!data.tipe?.length && <span className="text-sm text-zinc-500">Tipe belum tersedia.</span>}</div><WidgetTitle title="Studio" /><div className="flex flex-wrap gap-2">{(data.studio || []).map((item) => <Link key={item.id || item.name} href={`/daftar?mode=studio&studio=${encodeURIComponent(item.name)}&title=${encodeURIComponent(`Studio: ${item.name}`)}`} className={chipClass}>{item.name}</Link>)}{!data.studio?.length && <span className="text-sm text-zinc-500">Studio belum tersedia.</span>}</div></>}</Content><GenericSidebar /></Columns></>;
}
