"use client";
import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, store } from "@/lib/client";
import { LoadingGrid, ErrorBox } from "@/components/ui";
import { ChevronRight, ChevronLeft, Server, MonitorPlay, ArrowLeft } from "lucide-react";

function Inner({ episodeId }) {
  const animeId = useSearchParams().get("anime") || "";
  const [data, setData] = useState(null);
  const [anime, setAnime] = useState(null);
  const [eps, setEps] = useState([]);
  const [err, setErr] = useState("");
  const [server, setServer] = useState(null);

  useEffect(() => {
    setData(null); setServer(null); setErr("");
    api(`/api/stream/${episodeId}`)
      .then((d) => { setData(d); const best = [...(d.servers || [])].sort((a, b) => parseInt(b.quality) - parseInt(a.quality))[0]; setServer(best || null); })
      .catch((e) => setErr(e.message));
  }, [episodeId]);

  useEffect(() => {
    if (!animeId) return;
    api(`/api/detail/${animeId}`).then((d) => { setAnime(d); setEps(d.episodes || []); }).catch(() => {});
  }, [animeId]);

  useEffect(() => {
    if (data && anime) {
      store.pushHistory({ episodeId, animeId: anime.id, animeTitle: anime.title, episodeIndex: data.episode.index, image: anime.image_cover || anime.image_poster });
    }
  }, [data, anime, episodeId, animeId]);

  if (err) return <ErrorBox message={err} />;
  if (!data) return <LoadingGrid />;

  const curIdx = eps.findIndex((e) => String(e.id) === String(episodeId));
  const prev = curIdx > 0 ? eps[curIdx - 1] : null;
  const next = data.episode_next?.id ? { id: data.episode_next.id, index: data.episode_next.index } : (curIdx >= 0 && curIdx < eps.length - 1 ? eps[curIdx + 1] : null);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 fade-up">
      {anime && <Link href={`/anime/${anime.id}`} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-rose-400 mb-3"><ArrowLeft size={15} /> {anime.title}</Link>}

      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
        {server?.url ? (
          <video key={server.url} src={server.url} controls autoPlay playsInline className="w-full h-full" poster={anime?.image_cover || anime?.image_poster || undefined}
            onLoadedMetadata={(e) => { const p = store.getProgress(episodeId); if (p > 0) e.currentTarget.currentTime = p; }}
            onTimeUpdate={(e) => { const v = e.currentTarget; if (Math.round(v.currentTime) % 5 === 0) store.saveProgress(episodeId, v.currentTime, v.duration); }} />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center p-6 text-zinc-400 text-sm">Server streaming belum tersedia untuk episode ini.<br />Coba episode lain atau refresh sebentar lagi.</div>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-3 mt-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-lg leading-snug">{anime?.title || "Anime"} — Episode {data.episode.index}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data.servers.length} server tersedia {server?.quality ? `• kualitas ${server.quality}p` : ""}</p>
        </div>
        <div className="flex gap-2">
          {prev && <Link href={`/nonton/${prev.id}?anime=${animeId}`} className="inline-flex items-center gap-1 bg-white/8 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-full text-sm font-semibold"><ChevronLeft size={16} /> Prev</Link>}
          {next && <Link href={`/nonton/${next.id}?anime=${animeId}`} className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-rose-600/25">Next <ChevronRight size={16} /></Link>}
        </div>
      </div>

      {data.servers.length > 0 && (
        <section className="mt-6 bg-white/[.03] border border-white/6 rounded-2xl p-4">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-3"><Server size={16} className="text-rose-500" /> Pilih Server / Kualitas</h2>
          <div className="flex flex-wrap gap-2">
            {data.servers.map((s, i) => (
              <button key={`${s.server_id}-${i}`} onClick={() => setServer(s)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${server?.url === s.url ? "bg-rose-600 shadow-lg shadow-rose-600/25" : "bg-white/6 hover:bg-white/12 border border-white/8"}`}>
                <MonitorPlay size={13} className="inline mr-1 -mt-0.5" />{s.name || "Server"} {s.quality ? `${s.quality}p` : ""}{s.file_size ? ` • ${s.file_size}` : ""}
              </button>
            ))}
          </div>
        </section>
      )}

      {eps.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold mb-3 flex items-center gap-2"><span className="w-1 h-5 rounded bg-rose-600" /> Episode Lainnya</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-72 overflow-y-auto pr-1">
            {eps.map((e) => (
              <Link key={e.id} href={`/nonton/${e.id}?anime=${animeId}`}
                className={`text-center rounded-lg py-2.5 text-sm font-semibold border transition ${String(e.id) === String(episodeId) ? "bg-rose-600 border-rose-500" : "bg-white/5 hover:bg-rose-600 border-white/8"}`}>
                {e.index ?? "?"}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function Page({ params }) {
  const { id } = use(params);
  return <Suspense fallback={<LoadingGrid />}><Inner episodeId={id} /></Suspense>;
}
