"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { artworkYear } from "@/lib/artwork-utils.mjs";
import { api } from "@/lib/client";
import { hasText, statusLabel } from "@/lib/display.mjs";
import { chooseRandomAnime, randomCandidates } from "@/lib/random.mjs";
import { Poster } from "@/components/ui";

const RANDOM_ENDPOINT = "/api/home-section?section=acak&limit=100";

function ShuffleIcon() {
  return <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3h4v4M3 17h2.5c4.5 0 5-10 10-10H21M17 21h4v-4M3 7h2.5c1.6 0 2.7 1.2 3.7 2.8M14.8 14.2c1 1.6 2.1 2.8 3.7 2.8H21" /></svg>;
}

export default function RandomAnime() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const candidates = useRef([]);
  const lastId = useRef("");
  const request = useRef(null);

  useEffect(() => () => request.current?.abort(), []);

  async function draw() {
    // The ref also prevents two requests before React has rendered the loading state.
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setMessage("");

    try {
      let pool = candidates.current;
      if (!pool.length) {
        const response = await api(RANDOM_ENDPOINT, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!Array.isArray(response)) throw new Error("Invalid random anime response");
        pool = randomCandidates(response);
        candidates.current = pool;
      }
      const anime = chooseRandomAnime(pool, lastId.current);
      if (!anime) {
        setMessage("Belum ada anime acak yang tersedia. Coba lagi nanti.");
      } else {
        lastId.current = anime.id;
        setSelected(anime);
        if (pool.length === 1) setMessage("Saat ini hanya satu pilihan yang tersedia.");
      }
    } catch {
      if (!controller.signal.aborted) setMessage("Anime acak belum bisa dimuat. Coba lagi.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }

  const type = hasText(selected?.type) ? String(selected.type).trim() : "";
  const year = artworkYear(selected?.aired_start);
  const meta = [type, year ? `Tayang ${year}` : "", statusLabel(selected?.status)].filter(Boolean);
  const genre = hasText(selected?.genre) ? String(selected.genre).trim() : "";
  const synopsis = hasText(selected?.synopsis) ? String(selected.synopsis).trim() : "";
  const href = selected ? `/anime/${encodeURIComponent(selected.id)}` : "";

  return <section aria-labelledby="random-anime-title" className="min-w-0 rounded-lg border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 id="random-anime-title" className="text-lg font-bold">Anime Acak</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Bingung mau nonton apa? Temukan pilihan anime secara acak.</p>
      </div>
      <button type="button" onClick={draw} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-600 dark:hover:bg-amber-700">
        <ShuffleIcon /> {loading ? "Mencari..." : selected ? "Acak Lagi" : message ? "Coba Lagi" : "Cari Anime Acak"}
      </button>
    </div>
    {loading && <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Mencari anime untukmu...</p>}
    {message && <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>}
    <p className="sr-only" aria-live="polite" aria-atomic="true">{selected ? `Pilihan anime: ${selected.title}` : ""}</p>
    {selected && <div className="mt-4 flex min-w-0 gap-3 border-t border-zinc-300 pt-4 dark:border-zinc-600">
      <Link href={href} className="block w-20 shrink-0 self-start overflow-hidden rounded-md sm:w-28" tabIndex={-1} aria-hidden="true"><Poster src={selected.image_poster || selected.image_cover} alt={selected.title} airedStart={selected.aired_start} className="aspect-[3/4] w-full object-cover" /></Link>
      <div className="flex min-w-0 flex-col items-start gap-1">
        {selected.demo === true && <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Data demo · contoh anime</span>}
        <h3 className="line-clamp-2 text-sm font-bold text-zinc-800 [overflow-wrap:anywhere] dark:text-zinc-100 sm:text-base"><Link href={href} className="hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:hover:text-amber-400">{selected.title}</Link></h3>
        {meta.length > 0 && <p className="text-xs text-zinc-600 [overflow-wrap:anywhere] dark:text-zinc-400">{meta.join(" · ")}</p>}
        {genre && <p className="line-clamp-2 text-xs text-zinc-600 [overflow-wrap:anywhere] dark:text-zinc-400">{genre}</p>}
        {synopsis && <p className="line-clamp-2 text-xs text-zinc-600 [overflow-wrap:anywhere] dark:text-zinc-400">{synopsis}</p>}
        <Link href={href} className="mt-1 text-sm font-semibold text-amber-700 hover:text-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:text-amber-400 dark:hover:text-amber-300">Lihat Detail <span aria-hidden="true">→</span></Link>
      </div>
    </div>}
  </section>;
}
