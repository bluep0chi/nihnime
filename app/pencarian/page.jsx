"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { Grid, LoadingGrid, ErrorBox } from "@/components/ui";

function Inner() {
  const q = useSearchParams().get("q") || "";
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { setPage(0); setItems(null); api(`/api/list?mode=search&q=${encodeURIComponent(q)}&page=0`).then(setItems).catch((e) => setErr(e.message)); }, [q]);

  const more = async () => {
    setLoadingMore(true);
    try { const next = await api(`/api/list?mode=search&q=${encodeURIComponent(q)}&page=${page + 1}`); setItems((p) => [...p, ...next]); setPage(page + 1); } catch {}
    setLoadingMore(false);
  };

  if (err) return <ErrorBox message={err} />;
  if (!items) return <LoadingGrid />;
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 fade-up">
      <h1 className="font-bold text-xl mb-1">Hasil pencarian {q && <>“<span className="text-rose-500">{q}</span>”</>}</h1>
      <p className="text-sm text-zinc-500 mb-6">{items.length} judul ditemukan</p>
      {items.length ? <Grid items={items} /> : <p className="text-zinc-400">Tidak ada anime yang cocok. Coba kata kunci lain.</p>}
      {items.length >= 10 && <div className="text-center mt-8"><button onClick={more} disabled={loadingMore} className="bg-white/8 hover:bg-rose-600 border border-white/10 px-6 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50">{loadingMore ? "Memuat…" : "Muat Lebih Banyak"}</button></div>}
    </div>
  );
}
export default function Page() { return <Suspense fallback={<LoadingGrid />}><Inner /></Suspense>; }
