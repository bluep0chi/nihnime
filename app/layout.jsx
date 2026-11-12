import "./globals.css";
import { Navbar, BottomNav } from "@/components/ui";

export const metadata = {
  title: "NIHNIME — Nonton Anime Sub Indo Gratis",
  description: "Streaming anime subtitle Indonesia terbaru: episode baru, jadwal rilis, genre, studio, dan ribuan judul anime sub Indo.",
  manifest: "/manifest.webmanifest",
  themeColor: "#08080d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen pb-16 md:pb-0 antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="max-w-7xl mx-auto px-4 mt-16 pb-10 text-center text-xs text-zinc-600">
          <p className="font-black text-zinc-500 mb-1">NIH<span className="text-rose-600">NIME</span></p>
          Nonton anime sub Indo terbaru & terlengkap. Semua konten berasal dari API publik AnimeIn.
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
