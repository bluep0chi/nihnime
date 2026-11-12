"use client";
import { useEffect, useState } from "react";
import { store } from "@/lib/client";
import { Grid } from "@/components/ui";
import { Bookmark } from "lucide-react";

export default function Page() {
  const [items, setItems] = useState(null);
  const [history, setHistory] = useState([]);
  useEffect(() => { setItems(store.read("bookmark")); setHistory(store.read("history")); }, []);
  if (!items) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 fade-up">
      <h1 className="font-bold text-xl mb-1 flex items-center gap-2"><Bookmark className="text-rose-500" /> Bookmark Saya</h1>
      <p className="text-sm text-zinc-500 mb-6">Tersimpan di perangkat ini ({items.length} judul)</p>
      {items.length ? <Grid items={items} /> : <p className="text-zinc-400">Belum ada bookmark. Tekan ikon bookmark di halaman detail anime.</p>}
      {history.length > 0 && (
        <>
          <h2 className="font-bold text-lg mt-12 mb-4">Riwayat Tontonan</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <a key={h.episodeId} href={`/nonton/${h.episodeId}?anime=${h.animeId}`} className="flex items-center gap-3 bg-white/4 hover:bg-white/8 border border-white/6 rounded-xl p-2.5 transition">
                {h.image && <img src={h.image} alt="" className="w-24 aspect-video object-cover rounded-lg" />}
                <div className="min-w-0"><p className="font-medium text-sm line-clamp-1">{h.animeTitle}</p><p className="text-xs text-zinc-500">Episode {h.episodeIndex} • {new Date(h.at).toLocaleDateString("id-ID")}</p></div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
