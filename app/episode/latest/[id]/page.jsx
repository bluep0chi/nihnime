"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { ErrorBox, Loading } from "@/components/ui";

export default function Page({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    api(`/api/episodes/${encodeURIComponent(id)}?page=0`).then((episodes) => {
      if (!active) return;
      if (!episodes.length) { setError("Episode terbaru belum tersedia."); return; }
      router.replace(`/episode/${encodeURIComponent(episodes[0].id)}?anime=${encodeURIComponent(id)}`);
    }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id, router]);
  return error ? <><ErrorBox message={error} /><Link href={`/anime/${encodeURIComponent(id)}`} className="text-center text-sky-700 dark:text-sky-400">Lihat detail anime</Link></> : <Loading label="Mencari episode terbaru..." />;
}
