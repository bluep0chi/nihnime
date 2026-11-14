"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { dayLabel, jakartaDay, SCHEDULE_DAYS } from "@/lib/display.mjs";
import { Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenericSidebar, Loading, PosterGrid, WidgetTitle } from "@/components/ui";

export default function Page() {
  const [day, setDay] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Start with the requested day or today's WIB schedule, not all eight days.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("day")?.toUpperCase();
    setDay(SCHEDULE_DAYS.includes(requested) ? requested : jakartaDay());
  }, []);
  useEffect(() => {
    if (!day || Object.hasOwn(schedule, day)) return;
    let active = true;
    setError(null);
    api(`/api/schedule?day=${encodeURIComponent(day)}`).then((data) => {
      if (active) setSchedule((previous) => ({ ...previous, [day]: data[day] || [] }));
    }).catch((e) => { if (active) setError({ day, message: e.message }); });
    return () => { active = false; };
  }, [day, schedule, attempt]);

  const entries = day ? schedule[day] : undefined;
  const currentError = error?.day === day ? error.message : "";
  const chooseDay = (value) => {
    setDay(value);
    const url = new URL(window.location.href);
    url.searchParams.set("day", value);
    window.history.replaceState(null, "", url);
  };
  return <><Breadcrumb items={[{ title: "Schedule" }]} /><Columns><Content><WidgetTitle title="Jadwal Rilis" /><p className="text-sm text-zinc-500 dark:text-zinc-400">Hari ini mengikuti waktu WIB. Keterangan waktu berasal dari penyedia dan dapat berubah.</p><div role="group" aria-label="Pilih hari jadwal" className="flex flex-wrap gap-2">{SCHEDULE_DAYS.map((item) => <button key={item} type="button" className={`pagination-item ${day === item ? "active" : ""}`} aria-pressed={day === item} onClick={() => chooseDay(item)}>{dayLabel(item)}</button>)}</div>{day && <WidgetTitle title={dayLabel(day)} />}{currentError ? <ErrorBox message={currentError} onRetry={() => setAttempt((n) => n + 1)} /> : !entries ? <Loading label="Memuat jadwal..." /> : <>{entries.some((anime) => anime.demo) && <DemoNotice />}{entries.length ? <PosterGrid items={entries} schedule /> : <p className="text-sm text-zinc-500">Tidak ada jadwal pada hari yang dipilih.</p>}</>}</Content><GenericSidebar /></Columns></>;
}
