"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { LoadingGrid, ErrorBox } from "@/components/ui";
import { Building2, CalendarRange, MonitorPlay } from "lucide-react";

export default function Page() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/api/explore").then(setData).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorBox message={err} />;
  if (!data) return <LoadingGrid />;
  const groups = [...new Set(data.genre.map((g) => g.group).filter(Boolean))];
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 fade-up">
      <h1 className="font-bold text-xl mb-6">Jelajahi Anime</h1>

      {groups.map((group) => (
        <section key={group} className="mb-10">
          <h2 className="font-bold mb-3 flex items-center gap-2"><span className="w-1 h-5 rounded bg-rose-600" />{group}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.genre.filter((g) => g.group === group).map((g) => (
              <Link key={g.id} href={`/daftar?mode=genre&id_genre=${g.id}&title=${encodeURIComponent("Genre: " + g.name)}`} className="group relative h-24 rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-white/5 hover:ring-rose-500/60">
                {g.poster && <img src={g.poster} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition duration-500" />}
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <span className="absolute bottom-2.5 left-3 font-bold">{g.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-10">
        <h2 className="font-bold mb-3 flex items-center gap-2"><span className="w-1 h-5 rounded bg-rose-600" /><MonitorPlay size={18} className="text-rose-500" /> Berdasarkan Tipe</h2>
        <div className="flex flex-wrap gap-2">
          {data.tipe.map((t) => <Link key={t.id} href={`/daftar?mode=type&type=${encodeURIComponent(t.name)}&title=${encodeURIComponent("Tipe: " + t.name)}`} className="px-4 py-2 rounded-full bg-white/6 border border-white/8 hover:bg-rose-600 text-sm font-semibold transition">{t.name}</Link>)}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-bold mb-3 flex items-center gap-2"><span className="w-1 h-5 rounded bg-rose-600" /><CalendarRange size={18} className="text-rose-500" /> Berdasarkan Tahun</h2>
        <div className="flex flex-wrap gap-2">
          {data.tahun.map((y) => <Link key={y.name} href={`/daftar?mode=year&year=${y.name}&title=${encodeURIComponent("Tahun " + y.name)}`} className="px-4 py-2 rounded-full bg-white/6 border border-white/8 hover:bg-rose-600 text-sm font-semibold transition">{y.name}</Link>)}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-bold mb-3 flex items-center gap-2"><span className="w-1 h-5 rounded bg-rose-600" /><Building2 size={18} className="text-rose-500" /> Berdasarkan Studio</h2>
        <div className="flex flex-wrap gap-2">
          {data.studio.map((s) => <Link key={s.id} href={`/daftar?mode=studio&studio=${encodeURIComponent(s.name)}&title=${encodeURIComponent("Studio: " + s.name)}`} className="px-4 py-2 rounded-full bg-white/6 border border-white/8 hover:bg-rose-600 text-sm font-semibold transition">{s.name}</Link>)}
        </div>
      </section>
    </div>
  );
}
