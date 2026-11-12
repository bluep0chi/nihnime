"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { Grid, LoadingGrid, ErrorBox } from "@/components/ui";

function Inner() {
  const p = useSearchParams();
  const params = new URLSearchParams();
  ["mode","id_genre","studio","year","season","type","genre","sort"].forEach((k) => { const v = p.get(k); if (v) params.set(k, v); });
  if (p.get("q")) params.set("q", p.get("q"));
  const title = p.get("title") || "Daftar Anime";
  const key = params.toString();
  const [items, setItems] = useState(null);
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
      <p className="text-sm text-zinc-500 mb-6">{items.length} judul</p>
      {items.length ? <Grid items={items} /> : <p className="text-zinc-400">Belum ada anime pada kategori ini.</p>}
      {items.length >= 10 && <div className="text-center mt-8"><button onClick={more} disabled={busy} className="bg-white/8 hover:bg-rose-600 border border-white/10 px-6 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50">{busy ? "Memuat…" : "Muat Lebih Banyak"}</button></div>}
    </div>
  );
}
export default function Page() { return <Suspense fallback={<LoadingGrid />}><Inner /></Suspense>; }
