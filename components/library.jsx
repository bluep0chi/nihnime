"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { store } from "@/lib/client";
import { Breadcrumb, Columns, Content, GenericSidebar, PosterGrid, SquareGrid } from "@/components/ui";

export default function Library({ kind = "history" }) {
  const [items, setItems] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  useEffect(() => {
    const update = () => {
      setItems(store.read(kind));
      setCompletedCount(kind === "history" ? store.completedEpisodeIds().size : 0);
    };
    const unsubscribe = store.subscribe(kind === "history" ? ["history", "watched"] : ["bookmark"], update);
    window.addEventListener("pageshow", update);
    update();
    return () => { unsubscribe(); window.removeEventListener("pageshow", update); };
  }, [kind]);
  const history = kind === "history";
  const clear = () => {
    const message = history && completedCount ? "Yakin ingin menghapus semua riwayat dan tanda episode selesai?" : history ? "Yakin ingin menghapus semua riwayat?" : "Yakin ingin menghapus semua bookmark?";
    if (!window.confirm(message)) return;
    if (history) { store.clearHistory(); setCompletedCount(0); }
    else store.write(kind, []);
    setItems([]);
  };
  const remove = (item) => {
    if (history) {
      store.removeHistory(item.episodeId);
      setItems(store.read("history"));
      setCompletedCount(store.completedEpisodeIds().size);
    } else {
      const next = store.read(kind).filter((entry) => String(entry.id) !== String(item.id));
      store.write(kind, next); setItems(next);
    }
  };
  return <><Breadcrumb items={[{ title: history ? "History" : "Bookmark" }]} /><Columns><Content><div className="flex justify-between items-center gap-4"><h1 className="text-lg font-bold">{history ? "Riwayat Menonton" : "Bookmark Saya"}</h1>{items !== null && (items.length > 0 || (history && completedCount > 0)) && <button type="button" onClick={clear} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold">Hapus Semua</button>}</div><hr className="border-zinc-400 dark:border-zinc-600" /><p className="text-sm text-zinc-500">{history ? <>Pilih episode untuk melanjutkan dari posisi terakhir. Progres hanya tersimpan untuk video langsung. Lihat juga <Link href="/bookmark" className="underline text-amber-700 dark:text-amber-500">bookmark</Link>. Tanda episode selesai ikut dihapus jika riwayat dihapus.</> : <>Lihat juga <Link href="/history" className="underline text-amber-700 dark:text-amber-500">riwayat menonton</Link>.</>} Data tersimpan di browser ini.</p>{items === null ? <p className="text-sm text-zinc-500">Memuat...</p> : items.length ? history ? <SquareGrid items={items} history onRemove={remove} /> : <PosterGrid items={items} onRemove={remove} /> : <div className="text-center py-10 text-zinc-500">{history ? "Belum ada riwayat menonton." : "Belum ada bookmark. Simpan anime dari halaman detail."}</div>}</Content><GenericSidebar /></Columns></>;
}
