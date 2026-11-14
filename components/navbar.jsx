"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DONATION_URL, SearchIcon } from "./ui";

const links = [{ title: "Home", href: "/" }, { title: "Ongoing", href: "/ongoing" }, { title: "Completed", href: "/completed" }, { title: "History", href: "/history" }, { title: "Donasi", href: DONATION_URL }];
const buttonClass = "inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-zinc-700 rounded-lg hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700";

function ThemeIcon({ theme }) {
  return theme === "dark" ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M11.675 2.015a.998.998 0 0 0-.403.011C6.09 2.4 2 6.722 2 12c0 5.523 4.477 10 10 10 4.356 0 8.058-2.784 9.43-6.667a1 1 0 0 0-1.02-1.33c-.08.006-.105.005-.127.005h-.001l-.028-.002A5.227 5.227 0 0 1 20 14a8 8 0 0 1-8-8c0-.952.121-1.752.404-2.558a.996.996 0 0 0 .096-.428V3a1 1 0 0 0-.825-.985Z" /></svg> : <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M13 3a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0V3ZM6.343 4.929A1 1 0 0 0 4.93 6.343l1.414 1.414a1 1 0 0 0 1.414-1.414L6.343 4.929Zm12.728 1.414a1 1 0 0 0-1.414-1.414l-1.414 1.414a1 1 0 0 0 1.414 1.414l1.414-1.414ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-9 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H3Zm16 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2ZM7.757 17.657a1 1 0 1 0-1.414-1.414l-1.414 1.414a1 1 0 1 0 1.414 1.414l1.414-1.414Zm9.9-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414ZM13 19a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0v-2Z" /></svg>;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => { setTheme(document.documentElement.dataset.theme || "light"); }, []);
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [pathname]);
  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem("theme", next); } catch { /* theme still works for this visit */ }
    setTheme(next);
  };
  const submit = (event) => { event.preventDefault(); const q = query.trim(); if (q) { setSearchOpen(false); router.push(`/search?q=${encodeURIComponent(q)}`); } };
  return <nav id="navbar" className="bg-white dark:bg-zinc-900 fixed w-full z-50 top-0 start-0 border-b border-zinc-200 dark:border-zinc-800">
    <div className="container-x flex flex-wrap items-center justify-between py-2">
      <Link href="/" className="flex items-center space-x-3"><img src="/images/logo.png" className="w-8" alt="NIHNIME Logo" /><span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">NIHNIME</span></Link>
      <div className="flex md:order-2 space-x-2">
        <button id="navbar-button-search-main" type="button" onClick={() => setSearchOpen((open) => !open)} aria-label="Cari anime" aria-expanded={searchOpen} aria-controls="dropdownSearch" className={buttonClass}><SearchIcon /></button>
        <button id="button-theme" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Gunakan tema terang" : "Gunakan tema gelap"} className={buttonClass}><ThemeIcon theme={theme} /></button>
        <button type="button" onClick={() => setMenuOpen((open) => !open)} className={`${buttonClass} md:hidden`} aria-label="Buka menu utama" aria-controls="navbar-sticky" aria-expanded={menuOpen}><svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 17 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" /></svg></button>
      </div>
      <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${menuOpen ? "block" : "hidden"}`} id="navbar-sticky"><ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-zinc-300 rounded-lg bg-zinc-50 md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-zinc-800 md:dark:bg-zinc-900 dark:border-zinc-700">{links.map((link) => <li key={link.title}>{link.href.startsWith("http") ? <a href={link.href} className="navbar-link-item" target="_blank" rel="noreferrer">{link.title}</a> : <Link href={link.href} className={`navbar-link-item ${pathname === link.href ? "active" : ""}`}>{link.title}</Link>}</li>)}</ul></div>
    </div>
    {searchOpen && <div id="dropdownSearch" className="absolute top-full left-0 z-10 w-full p-4 bg-white dark:bg-zinc-900 text-sm border-b border-zinc-200 dark:border-zinc-600"><form onSubmit={submit} className="max-w-md mx-auto text-zinc-700 dark:text-zinc-200"><label htmlFor="navbar-input-search" className="sr-only">Cari anime</label><div className="relative w-full"><input autoFocus type="search" id="navbar-input-search" value={query} onChange={(e) => setQuery(e.target.value)} className="block p-2.5 w-full z-20 text-sm text-zinc-900 bg-zinc-50 rounded-lg border border-zinc-300 focus:ring-orange-500 focus:border-orange-500 dark:bg-zinc-800 dark:border-zinc-600 dark:placeholder-zinc-400 dark:text-white" placeholder="Cari anime.." required /><button type="submit" aria-label="Cari" className="absolute top-0 end-0 h-full p-2.5 text-sm font-medium text-white bg-orange-600 rounded-e-lg border border-orange-600 hover:bg-orange-700"><SearchIcon className="w-4 h-4" /></button></div></form></div>}
  </nav>;
}
