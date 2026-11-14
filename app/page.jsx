"use client";
import { useEffect, useState } from "react";
import { api, store, formatViews } from "@/lib/client";
import { Hero, Row, LoadingGrid, ErrorBox, AnimeCard } from "@/components/ui";
import { Flame, Sparkles, CalendarDays, Trophy, Hourglass, Shuffle, Zap, History, Play, Eye } from "lucide-react";

export default function HomePage() {
  const [data, setData] = useState(null);
  const [fyp, setFyp] = useState([]);
  const [err, setErr] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(store.read("history"));
    api("/api/home").then(setData).catch((e) => setErr(e.message));
    // Just For You (data/home/fyp) — gagal ambil tidak boleh merusak beranda
    api("/api/fyp").then((d) => setFyp(Array.isArray(d) ? d : d?.items || [])).catch(() => setFyp([]));
  }, []);

  if (err) return <ErrorBox message={err} />;
  if (!data) return <LoadingGrid />;

  return (
    <div className="fade-up">
      <Hero items={data.banner} />
      {data.demo && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <p className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl px-4 py-2.5">
            Mode demo: API AnimeIn tidak terjangkau dari server ini, jadi ditampilkan data contoh. Di Vercel data asli akan dimuat otomatis.
          </p>
        </div>
      )}
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
                  {h.progress > 0 && h.duration > 0 && <span className="absolute bottom-0 inset-x-0 h-1 bg-white/20"><span className="block h-full bg-rose-600" style={{ width: `${Math.min(100, (h.progress / h.duration) * 100)}%` }} /></span>}
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-500">Episode {h.episodeIndex}</p>
              </a>
            ))}
          </div>
        </section>
      )}
      {fyp.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-8">
          <h2 className="font-bold text-base sm:text-lg flex items-center gap-2 mb-3"><span className="w-1 h-5 rounded bg-rose-600" /><Sparkles size={18} className="text-rose-500" /> Just For You</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {fyp.map((f) => (
              <a key={f.id_fyp} href={`/nonton/${f.id_episode}?anime=${f.anime_id || ""}`} className="group relative shrink-0 w-[132px]">
                <div className="relative aspect-[3/4.4] rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-white/5 group-hover:ring-rose-500/50 transition">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {(f.url_thumbnail || f.poster) && <img src={f.url_thumbnail || f.poster} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition"><span className="w-10 h-10 rounded-full bg-rose-600/90 grid place-items-center"><Play size={16} fill="white" /></span></span>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-semibold line-clamp-2 leading-snug">{f.anime_title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 inline-flex items-center gap-1"><Eye size={10} /> {formatViews(f.views)} • {f.likes} suka</p>
                  </div>
                </div>
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
