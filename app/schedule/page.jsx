"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenericSidebar, Loading, PosterGrid, WidgetTitle } from "@/components/ui";
const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU", "RANDOM"];

export default function Page() {
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setSchedule(null); setError("");
    api("/api/schedule?day=SEMUA").then((data) => { if (active) setSchedule(data); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [attempt]);
  return <><Breadcrumb items={[{ title: "Schedule" }]} /><Columns><Content><WidgetTitle title="Jadwal Rilis" />{error ? <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} /> : !schedule ? <Loading /> : <>{Object.values(schedule).flat().some((anime) => anime.demo) && <DemoNotice />}{DAYS.map((day) => <div key={day} className="flex flex-col gap-4"><WidgetTitle title={day === "RANDOM" ? "Acak" : day[0] + day.slice(1).toLowerCase()} />{schedule[day]?.length ? <PosterGrid items={schedule[day]} schedule /> : <p className="text-sm text-zinc-500">Tidak ada jadwal.</p>}</div>)}</>}</Content><GenericSidebar /></Columns></>;
}
