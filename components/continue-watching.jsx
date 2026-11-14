"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { store } from "@/lib/client";
import { continueWatching, historyId } from "@/lib/history.mjs";
import { formatPlayerTime } from "@/lib/player.mjs";
import { Poster, WidgetTitle } from "@/components/ui";

export default function ContinueWatching() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const update = () => setItems(continueWatching(store.read("history")));
    const unsubscribe = store.subscribe(["history"], update);
    window.addEventListener("pageshow", update);
    update();
    return () => { unsubscribe(); window.removeEventListener("pageshow", update); };
  }, []);

  if (!items.length) return null;
  return <section className="flex flex-col gap-4" aria-label="Lanjut Menonton">
    <WidgetTitle title="Lanjut Menonton" href="/history" />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{items.map((item) => {
      const title = typeof item.animeTitle === "string" && item.animeTitle.trim() ? item.animeTitle : "Anime";
      const episode = historyId(item.episodeIndex);
      const episodeLabel = episode ? `Episode ${episode}` : "Episode";
      const position = Number(item.progress);
      const duration = Number(item.duration);
      const percent = Math.min(99, Math.round(position / duration * 100));
      const href = `/episode/${encodeURIComponent(historyId(item.episodeId))}?anime=${encodeURIComponent(historyId(item.animeId))}`;
      return <Link key={historyId(item.episodeId)} href={href} aria-label={`Lanjutkan ${title}, ${episodeLabel}, dari ${formatPlayerTime(position)}`} className="group flex min-w-0 gap-3 rounded-lg border border-zinc-300 bg-zinc-50 p-2 hover:border-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 dark:border-zinc-700 dark:bg-zinc-800">
        <Poster src={typeof item.image === "string" ? item.image : null} alt={title} airedStart={item.aired_start} className="h-24 w-20 shrink-0 rounded-md object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-bold text-zinc-700 [overflow-wrap:anywhere] group-hover:text-amber-700 dark:text-zinc-100 dark:group-hover:text-amber-400">{title}</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{episodeLabel}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatPlayerTime(position)} / {formatPlayerTime(duration)}</span>
          <progress className="history-progress mt-auto" value={percent} max="100" aria-label={`Progres ${title}: ${percent}%`} />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Lanjutkan</span>
        </div>
      </Link>;
    })}</div>
  </section>;
}
