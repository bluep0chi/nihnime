"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Flame, Play, Bookmark, Search, Home, CalendarDays, LayoutGrid, Clock } from "lucide-react";
import { formatViews } from "@/lib/client";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-rose-600 text-white shadow-lg shadow-rose-600/40"><Play size={16} fill="currentColor" /></span>
      <span className="font-black text-lg tracking-tight">NIH<span className="text-rose-500">NIME</span></span>
    </Link>
  );
}

export function Navbar() {
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn(); window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "bg-[#08080d]/90 backdrop-blur-xl border-b border-white/5" : "bg-gradient-to-b from-black/70 to-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 text-sm text-zinc-300 ml-2">
          <Link className="px-3 py-2 rounded-full hover:bg-white/10 hover:text-white" href="/">Beranda</Link>
          <Link className="px-3 py-2 rounded-full hover:bg-white/10 hover:text-white" href="/jadwal">Jadwal Rilis</Link>
          <Link className="px-3 py-2 rounded-full hover:bg-white/10 hover:text-white" href="/jelajahi">Jelajahi</Link>
          <Link className="px-3 py-2 rounded-full hover:bg-white/10 hover:text-white" href="/bookmark">Bookmark</Link>
        </nav>
        <form className="ml-auto flex-1 max-w-md" action="/pencarian">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input name="q" defaultValue={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari anime… (mis. Naruto)" autoComplete="off"
              className="w-full bg-white/8 border border-white/10 focus:border-rose-500/60 focus:bg-white/10 outline-none rounded-full pl-9 pr-4 py-2 text-sm placeholder:text-zinc-500 backdrop-blur" />
          </div>
        </form>
      </div>
    </header>
  );
}

export function BottomNav() {
  const items = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/jadwal", label: "Jadwal", icon: CalendarDays },
    { href: "/jelajahi", label: "Jelajahi", icon: LayoutGrid },
    { href: "/bookmark", label: "Bookmark", icon: Bookmark },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0c0c13]/95 backdrop-blur-xl border-t border-white/8 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-zinc-400 active:text-rose-500">
            <Icon size={20} />{label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AnimeCard({ anime, rank }) {
  if (!anime) return null;
  return (
    <Link href={`/anime/${anime.id}`} className="group relative shrink-0 w-[128px] sm:w-[150px] fade-up">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-white/5 group-hover:ring-rose-500/50 transition">
        {anime.image_poster
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={anime.image_poster} alt={anime.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
          : <div className="w-full h-full grid place-items-center text-zinc-600 text-xs p-2 text-center">{anime.title}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
        {rank != null && <span className="absolute -left-0.5 top-1 text-3xl font-black text-rose-600 drop-shadow-[0_2px_6px_rgba(0,0,0,.8)] italic">#{rank}</span>}
        {anime.type && <span className="absolute top-1.5 right-1.5 text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">{anime.type}</span>}
        {anime.latest_episode && <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-black/70 backdrop-blur px-1.5 py-0.5 rounded text-amber-300">{anime.latest_episode}</span>}
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition"><span className="w-11 h-11 rounded-full bg-rose-600/90 grid place-items-center shadow-xl shadow-rose-600/40"><Play size={18} fill="white" /></span></span>
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-2 text-[10px] text-zinc-300">
          {anime.year && <span>{anime.year}</span>}
          <span className="ml-auto inline-flex items-center gap-1"><Eye size={11} />{formatViews(anime.views)}</span>
        </div>
      </div>
      <h3 className="mt-2 text-[13px] font-medium leading-snug line-clamp-2 group-hover:text-rose-400 transition">{anime.title}</h3>
      {anime.genre && <p className="text-[11px] text-zinc-500 line-clamp-1">{anime.genre}</p>}
    </Link>
  );
}

export function Row({ title, icon: Icon = Flame, items, href, rank = false }) {
  const ref = useRef(null);
  if (!items?.length) return null;
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  return (
    <section className="max-w-7xl mx-auto px-4 mt-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-5 rounded bg-rose-600" />
        <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">{Icon && <Icon size={18} className="text-rose-500" />}{title}</h2>
        {href && <Link href={href} className="ml-auto text-xs text-rose-400 hover:text-rose-300 inline-flex items-center">Lihat Semua <ChevronRight size={14} /></Link>}
        <div className={`${href ? "" : "ml-auto"} hidden sm:flex gap-1`}>
          <button onClick={() => scroll(-1)} className="p-1.5 rounded-full bg-white/5 hover:bg-rose-600 transition" aria-label="Geser kiri"><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="p-1.5 rounded-full bg-white/5 hover:bg-rose-600 transition" aria-label="Geser kanan"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1 -mx-4 px-4">
        {items.map((a, i) => <AnimeCard key={`${a.id}-${i}`} anime={a} rank={rank ? i + 1 : undefined} />)}
      </div>
    </section>
  );
}

export function Hero({ items }) {
  const slides = (items || []).filter((b) => b.image).slice(0, 8);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return <div className="h-16" />;
  const s = slides[idx];
  // link banner format AnimeIn biasanya berisi id anime — jadikan /anime/<id> bila ketemu angka
  const id = String(s.link || "").match(/\d+/)?.[0];
  const href = id ? `/anime/${id}` : "/jelajahi";
  return (
    <section className="relative h-[62vh] min-h-[380px] max-h-[560px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={s.image} src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover kenburns" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-black/35 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-14">
        <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold tracking-widest bg-rose-600 px-2.5 py-1 rounded mb-3"><Flame size={12} /> SEDANG TAYANG</span>
        <Link href={href} className="inline-flex w-fit items-center gap-2 bg-rose-600 hover:bg-rose-500 transition font-semibold px-5 py-2.5 rounded-full shadow-xl shadow-rose-600/30"><Play size={17} fill="white" /> Tonton Sekarang</Link>
      </div>
      <div className="absolute bottom-5 right-4 flex gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Banner ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-7 bg-rose-500" : "w-2.5 bg-white/40 hover:bg-white/70"}`} />
        ))}
      </div>
    </section>
  );
}

export function LoadingGrid() {
  return <div className="max-w-7xl mx-auto px-4 mt-20 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />)}</div>;
}

export function ErrorBox({ message }) {
  return (
    <div className="max-w-xl mx-auto px-4 mt-28 text-center fade-up">
      <Clock size={40} className="mx-auto text-rose-500 mb-3" />
      <h2 className="font-bold text-lg mb-1">Server anime sedang tidak terjangkau</h2>
      <p className="text-sm text-zinc-400 mb-5">{message || "Gagal memuat data. Periksa koneksi lalu coba lagi."}</p>
      <button onClick={() => location.reload()} className="bg-rose-600 hover:bg-rose-500 px-5 py-2.5 rounded-full text-sm font-semibold">Coba Lagi</button>
    </div>
  );
}

export function Grid({ items }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
      {items.map((a, i) => <div key={`${a.id}-${i}`} className="[&>a]:w-full"><AnimeCard anime={a} /></div>)}
    </div>
  );
}
