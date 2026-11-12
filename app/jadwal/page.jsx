"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Grid, LoadingGrid, ErrorBox } from "@/components/ui";

const DAYS = ["SENIN","SELASA","RABU","KAMIS","JUMAT","SABTU","MINGGU","RANDOM"];
const today = ["MINGGU","SENIN","SELASA","RABU","KAMIS","JUMAT","SABTU"][new Date().getDay()];

export default function Page() {
  const [day, setDay] = useState(today);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { setData(null); api(`/api/schedule?day=${day}`).then(setData).catch((e) => setErr(e.message)); }, [day]);
  if (err) return <ErrorBox message={err} />;
  const items = data?.[day] || [];
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 fade-up">
      <h1 className="font-bold text-xl mb-1">Jadwal Rilis Anime</h1>
      <p className="text-sm text-zinc-500 mb-5">Anime yang tayang setiap hari (waktu server AnimeIn).</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4">
        {DAYS.map((d) => (
          <button key={d} onClick={() => setDay(d)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${day === d ? "bg-rose-600 shadow-lg shadow-rose-600/30" : "bg-white/6 hover:bg-white/12 border border-white/8"}`}>{d === "RANDOM" ? "Acak" : d.charAt(0) + d.slice(1).toLowerCase()}{d === today ? " •" : ""}</button>
        ))}
      </div>
      {!data ? <LoadingGrid /> : items.length ? <Grid items={items} /> : <p className="text-zinc-400">Tidak ada jadwal untuk hari ini.</p>}
    </div>
  );
}
