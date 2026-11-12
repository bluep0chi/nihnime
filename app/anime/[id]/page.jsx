"use client";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { api, store, formatViews } from "@/lib/client";
import { Row, LoadingGrid, ErrorBox } from "@/components/ui";
import { Play, Bookmark, BookmarkCheck, Eye, CalendarDays, Building2, Layers, Search } from "lucide-react";

export default function Page({ params }) {
  const { id } = use(params);
  const [anime, setAnime] = useState(null);
  const [eps, setEps] = useState([]);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAnime(null); setErr("");
    api(`/api/detail/${id}`)
      .then((d) => { setAnime(d); setEps(d.episodes || []); setHasMore((d.episodes || []).length > 0); setSaved(store.isBookmarked(d.id)); })
      .catch((e) => setErr(e.message));
  }, [id]);

  // cari episode (server-side, mengganti daftar)
  useEffect(() => {
    if (!anime || q === "") return;
    const t = setTimeout(() => {
      api(`/api/episodes/${id}?page=0&search=${encodeURIComponent(q)}`).then(setEps).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [q, anime, id]);

  const loadMore = async () => {
    setBusy(true);
    try {
      const next = await api(`/api/episodes/${id}?page=${page + 1}`);
      setEps((p) => [...p, ...next]); setPage(page + 1); setHasMore(next.length > 0);
    } catch {}
    setBusy(false);
  };

  const toggle = () => anime && setSaved(store.toggleBookmark(anime));
  const first = eps[0];
  const sorted = useMemo(() => [...eps], [eps]);

  if (err) return <ErrorBox message={err} />;
  if (!anime) return <LoadingGrid />;

  return (
    <div className="fade-up">
      {/* Header / backdrop */}
      <section className="relative min-h-[420px] flex items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(anime.image_cover || anime.image_poster) && <img src={anime.image_cover || anime.image_poster} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-black/55 to-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-8 flex gap-5 items-end w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {anime.image_poster && <img src={anime.image_poster} alt={anime.title} className="hidden sm:block w-40 aspect-[3/4] object-cover rounded-xl ring-1 ring-white/20 shadow-2xl" />}
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {anime.type && <span className="text-[11px] font-bold bg-rose-600 px-2 py-0.5 rounded">{anime.type}</span>}
              {anime.status && <span className="text-[11px] font-semibold bg-white/15 backdrop-blur px-2 py-0.5 rounded">{anime.status}</span>}
              {anime.year && <span className="text-[11px] font-semibold bg-white/15 backdrop-blur px-2 py-0.5 rounded">{anime.year}</span>}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black leading-tight drop-shadow">{anime.title}</h1>
            {anime.synonyms && <p className="text-sm text-zinc-400 mt-1 line-clamp-1">{anime.synonyms}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-zinc-300">
              <span className="inline-flex items-center gap-1"><Eye size={13} /> {formatViews(anime.views)} ditonton</span>
              {anime.studio && <span className="inline-flex items-center gap-1"><Building2 size={13} /> {anime.studio}</span>}
              {anime.aired_start && <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {anime.aired_start}{anime.aired_end ? ` – ${anime.aired_end}` : ""}</span>}
              <span className="inline-flex items-center gap-1"><Layers size={13} /> {eps.length}+ episode</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              {first && <Link href={`/nonton/${first.id}?anime=${anime.id}`} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 font-semibold px-5 py-2.5 rounded-full shadow-xl shadow-rose-600/30 transition"><Play size={17} fill="white" /> Tonton Episode {first.index ?? 1}</Link>}
              <button onClick={toggle} className={`inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full backdrop-blur transition ${saved ? "bg-amber-500 text-black" : "bg-white/12 hover:bg-white/20 border border-white/15"}`}>
                {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />} {saved ? "Tersimpan" : "Bookmark"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {anime.genre && <div className="flex flex-wrap gap-2 mt-2">{String(anime.genre).split(",").map((g) => <span key={g} className="text-xs bg-white/6 border border-white/8 px-3 py-1.5 rounded-full">{g.trim()}</span>)}</div>}
        {anime.synopsis && (
          <section className="mt-6 bg-white/[.03] border border-white/6 rounded-2xl p-5">
            <h2 className="font-bold mb-2">Sinopsis</h2>
            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">{anime.synopsis}</p>
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><span className="w-1 h-5 rounded bg-rose-600" /> Daftar Episode</h2>
            <span className="text-xs text-zinc-500">{eps.length} episode termuat</span>
            <div className="relative ml-auto w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor episode…" className="w-full bg-white/6 border border-white/10 focus:border-rose-500/60 outline-none rounded-full pl-9 pr-4 py-2 text-sm" />
            </div>
          </div>
          {sorted.length ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {sorted.map((e) => (
                <Link key={e.id} href={`/nonton/${e.id}?anime=${anime.id}`} title={e.title || `Episode ${e.index}`}
                  className="relative text-center bg-white/5 hover:bg-rose-600 border border-white/8 hover:border-rose-500 rounded-lg py-2.5 text-sm font-semibold transition">
                  {e.index ?? "?"}
                  {e.is_new === "Y" && <span className="absolute -top-1.5 -right-1 text-[9px] font-black bg-amber-400 text-black px-1 rounded">BARU</span>}
                </Link>
              ))}
            </div>
          ) : <p className="text-zinc-400 text-sm">Episode belum tersedia.</p>}
          {hasMore && q === "" && (
            <div className="text-center mt-6"><button onClick={loadMore} disabled={busy} className="bg-white/8 hover:bg-rose-600 border border-white/10 px-6 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50">{busy ? "Memuat…" : "Muat Episode Lainnya"}</button></div>
          )}
        </section>
      </div>

      {anime.seasons?.length > 0 && <Row title="Season / Sekuel Terkait" items={anime.seasons} />}
    </div>
  );
}
