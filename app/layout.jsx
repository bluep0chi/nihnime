import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata = {
  title: "NIHNIME — Nonton Anime Sub Indo",
  description: "Streaming anime subtitle Indonesia terbaru: episode baru, jadwal rilis, genre, dan daftar anime.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.png" },
  referrer: "no-referrer",
};
export const viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

const themeScript = `(function(){try{var saved=localStorage.getItem('theme');var theme=saved==='light'||saved==='dark'?saved:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme='light';}})();`;
export default function RootLayout({ children }) {
  return <html lang="id" suppressHydrationWarning><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" /><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className="font-inter relative bg-zinc-200 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-50"><Navbar /><main id="main" className="container-x min-h-screen relative pt-[69px] pb-3 flex flex-col gap-3">{children}</main><Footer /></body></html>;
}
