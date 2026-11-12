"use client";
import { useEffect, useState } from "react";
import { api, store } from "@/lib/client";
import { Hero, Row, LoadingGrid, ErrorBox, AnimeCard } from "@/components/ui";
import { Flame, Sparkles, CalendarDays, Trophy, Hourglass, Shuffle, Zap, History } from "lucide-react";

export default function HomePage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(store.read("history"));
    api("/api/home").then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorBox message={err} />;
  if (!data) return <LoadingGrid />;

  return (
    <div className="fade-up">
      <Hero items={data.banner} />
      {history.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-8">
          <h2 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3"><span className="w-1 h-5 rounded bg-rose-600" /><History size={18} className="text-rose-500" /> Lanjutkan Menonton</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {history.slice(0, 12).map((h) => (
              <a key={h.episodeId} href={`/nonton/${h.episodeId}?anime=${h.animeId}`} className="group relative shrink-0 w-[220px]">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-white/5 group-hover:ring-rose-500/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {h.image && <img src={h.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <span className="absolute bottom-2 left-2 right-2 text-xs font-medium line-clamp-1">{h.animeTitle}</span>
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-500">Episode {h.episodeIndex}</p>
              </a>
            ))}
          </div>
        </section>
      )}
      <Row title="Episode Baru Rilis" icon={Zap} items={data.episode_baru} href="/daftar?mode=search&title=Semua%20Anime" />
      <Row title="Sedang Hangat" icon={Flame} items={data.sedang_hangat} />
      <Row title="Paling Populer" icon={Trophy} items={data.paling_populer} rank />
      <Row title="Jadwal Hari Ini" icon={CalendarDays} items={data.jadwal_hari_ini} href="/jadwal" />
      <Row title="Judul Baru Ditambahkan" icon={Sparkles} items={data.judul_baru} />
      <Row title="Paling Dinanti" icon={Hourglass} items={data.paling_dinanti} />
      <Row title="Acak Untukmu" icon={Shuffle} items={data.acak} />
    </div>
  );
}
