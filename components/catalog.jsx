"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { findFirstInitialPage, startsWithInitial, titleInitial } from "@/lib/az.mjs";
import { HOME_SECTIONS } from "@/lib/sections.mjs";
import { collectStatusPage, formatStatusCursor, parseStatusCursor, parseStatusTrail } from "@/lib/status-pages.mjs";
import { AlphabetChips, Breadcrumb, Columns, Content, DemoNotice, ErrorBox, GenericSidebar, GenreSidebar, Loading, Pagination, PosterGrid, SearchIcon, SquareGrid, WidgetTitle } from "@/components/ui";

const initialPageCache = new Map();
function safePage(value) { const n = Number(value); return Number.isSafeInteger(n) && n > 0 ? Math.min(n - 1, 10000) : 0; }
function slug(name) { return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function SearchForm({ q = "" }) {
  return <form action="/search" className="w-full mx-auto"><label htmlFor="default-search" className="sr-only">Cari anime</label><div className="relative"><div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"><SearchIcon className="w-4 h-4" /></div><input key={q} type="search" id="default-search" name="q" defaultValue={q} className="block w-full p-4 ps-10 text-sm text-zinc-900 border border-zinc-300 rounded-lg bg-zinc-50 focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-700 dark:border-zinc-600 dark:placeholder-zinc-400 dark:text-white" placeholder="Cari anime..." required /><button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-amber-700 hover:bg-amber-800 focus:ring-4 focus:outline-none focus:ring-amber-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-amber-600 dark:hover:bg-amber-700">Search</button></div></form>;
}

function CatalogContent({ kind, identifier }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const page = safePage(params.get("page"));
  const q = (params.get("q") || "").trim();
  const queryString = params.toString();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [genres, setGenres] = useState(null);
  const [genreError, setGenreError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    if (kind === "genre") api("/api/genres").then((data) => { if (active) { setGenres(data); setGenreError(""); } }).catch((e) => { if (active) setGenreError(e.message); });
    return () => { active = false; };
  }, [kind, attempt]);

  const genre = kind === "genre" && genres ? genres.find((g) => String(g.id) === String(identifier) || slug(g.name) === String(identifier).toLowerCase()) : null;
  const genreName = params.get("name") || genre?.name || identifier;
  const letter = String(identifier || "").toUpperCase();
  const section = Object.hasOwn(HOME_SECTIONS, identifier) ? HOME_SECTIONS[identifier] : null;
  const statusFiltered = kind === "ongoing" || kind === "completed";
  let title = "Daftar Anime";
  let breadcrumb = [{ title: "Anime" }];
  if (kind === "ongoing") { title = "Anime Sedang Tayang"; breadcrumb = [{ title: "Ongoing" }]; }
  else if (kind === "completed") { title = "Anime Selesai Tayang"; breadcrumb = [{ title: "Completed" }]; }
  else if (kind === "search") { title = q ? `Hasil Pencarian : ${q}` : "Cari anime"; breadcrumb = [{ title: "Search", href: "/search" }, ...(q ? [{ title: q }] : [])]; }
  else if (kind === "recent") { title = "Episode Terbaru"; breadcrumb = [{ title: "Recent" }]; }
  else if (kind === "genre") { title = `Anime: ${genreName}`; breadcrumb = [{ title: "Genres", href: "/genres" }, { title: genreName }]; }
  else if (kind === "az") { title = `Daftar Anime: ${letter}`; breadcrumb = [{ title: "A-Z List" }, { title: letter }]; }
  else if (kind === "catalog") { title = params.get("title") || "Daftar Anime"; breadcrumb = [{ title: "Daftar Anime" }]; }
  else if (kind === "section") { title = section?.title || "Pilihan Anime"; breadcrumb = [{ title }]; }

  useEffect(() => {
    let active = true;
    const currentParams = new URLSearchParams(queryString);
    setResult(null); setError("");
    if (kind === "search" && !q) { setResult({ items: [], hasNext: false }); return () => { active = false; }; }
    if (kind === "genre" && !genres && !genreError) return () => { active = false; };
    if (kind === "genre" && genreError) { setError(genreError); return () => { active = false; }; }
    if (kind === "genre" && !genre) { setError("Genre tidak ditemukan."); return () => { active = false; }; }
    if (kind === "az" && !/^(?:[A-Z0-9]|0-9)$/.test(letter)) { setError("Pilih huruf A-Z atau angka."); return () => { active = false; }; }
    if (kind === "section" && !section) { setError("Pilihan anime tidak ditemukan."); return () => { active = false; }; }

    async function load() {
      if (kind === "az") {
        const digitGroup = letter === "0-9";
        const initial = digitGroup ? "0" : letter;
        const pages = new Map();
        const loadPage = async (number) => {
          if (!pages.has(number)) {
            const p = new URLSearchParams({ mode: "search", sort: "alphabet", page: String(number) });
            if (!digitGroup) p.set("q", letter);
            pages.set(number, await api(`/api/list?${p}`));
          }
          return pages.get(number);
        };
        let first = initialPageCache.get(letter);
        if (first === undefined) { first = await findFirstInitialPage(loadPage, initial); initialPageCache.set(letter, first); }
        const raw = await loadPage(first + page);
        const items = raw.filter((item) => digitGroup ? /^[0-9]/.test(String(item.title || "").trim()) : startsWithInitial(item, letter));
        const last = titleInitial(raw.at(-1)?.title);
        const upper = digitGroup ? "9" : letter;
        return { items, hasNext: raw.length >= 30 && last <= upper };
      }
      if (kind === "recent" || kind === "section") {
        const size = 30;
        const limit = Math.min(301, (page + 1) * size + 1);
        const key = kind === "recent" ? "episode_baru" : section.key;
        const raw = await api(`/api/home-section?section=${encodeURIComponent(key)}&limit=${limit}`);
        return { items: raw.slice(page * size, (page + 1) * size), hasNext: raw.length > (page + 1) * size && limit < 301 };
      }
      if (statusFiltered) {
        const cursor = parseStatusCursor(currentParams.get("cursor")) || { page, offset: 0 };
        const filtered = await collectStatusPage((number) => active ? api(`/api/list?mode=search&page=${number}`) : Promise.reject(new Error("Permintaan dibatalkan.")), kind, cursor);
        return { ...filtered, hasNext: Boolean(filtered.nextCursor) };
      }
      const p = new URLSearchParams({ page: String(page) });
      if (kind === "search") { p.set("mode", "search"); p.set("q", q); }
      else if (kind === "genre") { p.set("mode", "genre"); p.set("id_genre", String(genre.id)); }
      else if (kind === "catalog") {
        for (const key of ["mode", "q", "genre", "sort", "id_genre", "studio", "year", "season", "type"]) if (currentParams.get(key)) p.set(key, currentParams.get(key));
      }
      const raw = await api(`/api/list?${p}`);
      return { items: raw, hasNext: raw.length >= 30 };
    }
    load().then((data) => { if (active) setResult(data); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [kind, identifier, page, q, queryString, genre?.id, genres, genreError, attempt, letter, section, statusFiltered]);

  function navigate(next) {
    const search = next.toString();
    router.push(`${pathname}${search ? `?${search}` : ""}`);
  }
  function setQuery(key, value) {
    const next = new URLSearchParams(queryString);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    navigate(next);
  }
  function setStatusPage(nextPage) {
    const next = new URLSearchParams(queryString);
    const trail = parseStatusTrail(params.get("trail"));
    const current = parseStatusCursor(params.get("cursor")) || { page, offset: 0 };
    let cursor;
    if (nextPage > page && result?.nextCursor) {
      trail.push(current);
      cursor = result.nextCursor;
    } else if (nextPage < page) {
      cursor = trail.pop() || { page: Math.max(0, page - 1), offset: 0 };
    } else return;
    const encoded = formatStatusCursor(cursor);
    if (encoded === "0.0" && !trail.length) next.delete("cursor"); else next.set("cursor", encoded);
    if (trail.length) next.set("trail", trail.map(formatStatusCursor).join(",")); else next.delete("trail");
    if (nextPage) next.set("page", String(nextPage + 1)); else next.delete("page");
    navigate(next);
  }
  return <><Breadcrumb items={breadcrumb} /><Columns><Content><WidgetTitle title={title} />{kind === "search" && <SearchForm q={q} />}{kind === "catalog" && <div className="flex flex-wrap items-center gap-3 text-sm"><label htmlFor="sort">Urutkan:</label><select id="sort" value={params.get("sort") || "views"} onChange={(event) => setQuery("sort", event.target.value)} className="bg-zinc-50 border border-zinc-300 rounded-lg p-2 dark:bg-zinc-700 dark:border-zinc-600"><option value="views">Paling populer</option><option value="alphabet">A–Z</option></select>{params.get("mode") === "year" && <><label htmlFor="season">Season:</label><select id="season" value={params.get("season") || ""} onChange={(event) => setQuery("season", event.target.value)} className="bg-zinc-50 border border-zinc-300 rounded-lg p-2 dark:bg-zinc-700 dark:border-zinc-600"><option value="">Semua</option><option value="winter">Winter</option><option value="spring">Spring</option><option value="summer">Summer</option><option value="fall">Fall</option></select></>}</div>}{kind === "az" && <AlphabetChips current={letter} />}{statusFiltered && <p className="text-sm text-zinc-500">Status disaring dari katalog penyedia. Urutan dan ketersediaan judul dapat berubah.</p>}{kind === "section" && identifier === "judul-baru" && <p className="text-sm text-zinc-500">Judul yang baru ditambahkan penyedia, bukan selalu anime yang baru tayang.</p>}{error ? <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} /> : !result ? <Loading /> : <>{result.items.some((item) => item.demo) && <DemoNotice />}{result.items.length ? kind === "recent" ? <SquareGrid items={result.items} /> : <PosterGrid items={result.items} /> : (kind !== "search" || q) && <p className="text-sm text-zinc-500">{statusFiltered && result.hasNext ? "Belum ada judul yang cocok dalam halaman yang diperiksa. Lanjutkan ke halaman berikutnya." : "Tidak ada anime yang ditemukan."}</p>}{result.scanLimitReached && result.items.length > 0 && <p className="text-sm text-zinc-500">Hasil lainnya mungkin ada di halaman berikutnya.</p>}{(page > 0 || result.hasNext) && <Pagination page={page} hasNext={result.hasNext} onPage={statusFiltered ? setStatusPage : (next) => setQuery("page", next ? String(next + 1) : "")} />}</>}</Content>{kind === "genre" ? <GenreSidebar genres={genres || []} /> : <GenericSidebar />}</Columns></>;
}

export default function Catalog({ kind = "catalog", identifier = "" }) {
  return <Suspense fallback={<Loading />}><CatalogContent kind={kind} identifier={identifier} /></Suspense>;
}
