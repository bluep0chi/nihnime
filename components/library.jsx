"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { store } from "@/lib/client";
import { Breadcrumb, Columns, Content, GenericSidebar, PosterGrid, SquareGrid } from "@/components/ui";

export default function Library({ kind = "history" }) {
  const [items, setItems] = useState(null);
  useEffect(() => { setItems(store.read(kind)); }, [kind]);
  const history = kind === "history";
  const clear = () => {
    if (!window.confirm(history ? "Yakin ingin menghapus semua riwayat?" : "Yakin ingin menghapus semua bookmark?")) return;
    store.write(kind, []); setItems([]);
  };
  return <><Breadcrumb items={[{ title: history ? "History" : "Bookmark" }]} /><Columns><Content><div className="flex justify-between items-center gap-4"><h1 className="text-lg font-bold">{history ? "Riwayat Menonton" : "Bookmark Saya"}</h1>{items?.length > 0 && <button type="button" onClick={clear} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold">Hapus Semua</button>}</div><hr className="border-zinc-400 dark:border-zinc-600" /><p className="text-sm text-zinc-500">{history ? <>Lihat juga <Link href="/bookmark" className="underline text-amber-700 dark:text-amber-500">bookmark</Link>.</> : <>Lihat juga <Link href="/history" className="underline text-amber-700 dark:text-amber-500">riwayat menonton</Link>.</>}</p>{items === null ? <p className="text-sm text-zinc-500">Memuat...</p> : items.length ? history ? <SquareGrid items={items} history /> : <PosterGrid items={items} /> : <div className="text-center py-10 text-zinc-500">{history ? "Belum ada riwayat menonton." : "Belum ada bookmark. Simpan anime dari halaman detail."}</div>}</Content><GenericSidebar /></Columns></>;
}
