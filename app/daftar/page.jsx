"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { Grid, LoadingGrid, ErrorBox } from "@/components/ui";

function Inner() {
  const p = useSearchParams();
  const [sort, setSort] = useState(p.get("sort") || "views");
  const [genreSel, setGenreSel] = useState((p.get("genre") || "").split(",").filter(Boolean));
  const [genres, setGenres] = useState([]);
  const params = new URLSearchParams();
  ["mode","id_genre","studio","year","season","type"].forEach((k) => { const v = p.get(k); if (v) params.set(k, v); });
  if (p.get("q")) params.set("q", p.get("q"));
  params.set("sort", sort);
  if (genreSel.length) params.set("genre", genreSel.join(","));
  const title = p.get("title") || "Daftar Anime";
  const key = params.toString();
  const [items, setItems] = useState(null);

  useEffect(() => { api("/api/genres").then((g) => setGenres(g.filter((x) => x.group === "Genre"))).catch(() => {}); }, []);
  const toggleGenre = (id) => setGenreSel((s) => s.includes(String(id)) ? s.filter((x) => x !== String(id)) : [...s, String(id)]);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPage(0); setItems(null); api(`/api/list?${key}&page=0`).then(setItems).catch((e) => setErr(e.message)); }, [key]);
  const more = async () => { setBusy(true); try { const n = await api(`/api/list?${key}&page=${page + 1}`); setItems((x) => [...x, ...n]); setPage(page + 1); } catch {} setBusy(false); };

  if (err) return <ErrorBox message={err} />;
  if (!items) return <LoadingGrid />;
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 fade-up">
      <h1 className="font-bold text-xl mb-1">{title}</h1>
      <p className="text-sm text-zinc-500 mb-4">{items.length} judul</p>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-zinc-500 font-semibold">Urutkan:</span>
        {[["views", "Paling Populer"], ["alphabet", "A – Z"]].map(([v, label]) => (
          <button key={v} onClick={() => setSort(v)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${sort === v ? "bg-rose-600" : "bg-white/6 border border-white/8 hover:bg-white/12"}`}>{label}</button>
        ))}
        {genreSel.length > 0 && <button onClick={() => setGenreSel([])} className="text-xs text-rose-400 hover:text-rose-300 ml-1">Reset filter genre ({genreSel.length})</button>}
      </div>
      {genres.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4">
          {genres.map((g) => (
            <button key={g.id} onClick={() => toggleGenre(g.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${genreSel.includes(String(g.id)) ? "bg-amber-500 text-black font-bold" : "bg-white/5 border border-white/8 hover:bg-white/12"}`}>{g.name}</button>
          ))}
        </div>
      )}
      {items.length ? <Grid items={items} /> : <p className="text-zinc-400">Belum ada anime pada kategori ini.</p>}
      {items.length >= 10 && <div className="text-center mt-8"><button onClick={more} disabled={busy} className="bg-white/8 hover:bg-rose-600 border border-white/10 px-6 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50">{busy ? "Memuat…" : "Muat Lebih Banyak"}</button></div>}
    </div>
  );
}
export default function Page() { return <Suspense fallback={<LoadingGrid />}><Inner /></Suspense>; }
