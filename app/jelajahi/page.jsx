"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
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
  return <><Breadcrumb items={[{ title: "Jelajahi" }]} /><Columns><Content><WidgetTitle title="Jelajahi Anime" />{error ? <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} /> : !data ? <Loading /> : <>{data.genre?.some((item) => item.demo) && <DemoNotice />}<WidgetTitle title="Daftar Genre" href="/genres" /><GenreChips genres={data.genre || []} /><WidgetTitle title="Seasons / Tahun" /><div className="flex flex-wrap gap-2">{(data.tahun || []).map((item) => <Link key={item.name} href={`/daftar?mode=year&year=${encodeURIComponent(item.name)}&title=${encodeURIComponent(`Tahun ${item.name}`)}`} className={chipClass}>{item.name}</Link>)}</div><WidgetTitle title="Tipe" /><div className="flex flex-wrap gap-2">{(data.tipe || []).map((item) => <Link key={item.id || item.name} href={`/daftar?mode=type&type=${encodeURIComponent(item.name)}&title=${encodeURIComponent(`Tipe: ${item.name}`)}`} className={chipClass}>{item.name}</Link>)}</div><WidgetTitle title="Studio" /><div className="flex flex-wrap gap-2">{(data.studio || []).map((item) => <Link key={item.id || item.name} href={`/daftar?mode=studio&studio=${encodeURIComponent(item.name)}&title=${encodeURIComponent(`Studio: ${item.name}`)}`} className={chipClass}>{item.name}</Link>)}</div></>}</Content><GenericSidebar /></Columns></>;
}
