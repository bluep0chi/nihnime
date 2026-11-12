# NIHNIME — Aplikasi Streaming Anime Sub Indo

Versi anime dari aplikasi donghua: **UI dipertahankan** (tema gelap, hero banner slider,
row poster geser, navigasi atas + bottom-nav mobile, halaman detail & player) tapi seluruh
konten diganti dari donghua menjadi **anime** memakai API AnimeIn, dan di-upgrade ke
stack terbaru: **Next.js 16, React 19, Tailwind CSS 4, Node 22**.

## Fitur
- **Beranda** — banner slider otomatis, Episode Baru, Sedang Hangat, Paling Populer (ranking),
  Jadwal Hari Ini, Judul Baru, Paling Dinanti, Acak, + *Lanjutkan Menonton* dari riwayat lokal
- **Nonton** — player video bawaan, pilih server/kualitas (360p–1080p), episode Prev/Next,
  daftar episode, riwayat tontonan tersimpan otomatis
- **Detail anime** — sinopsis, info studio/tahun/status, cari nomor episode, muat episode
  bertahap, season/sekuel terkait, tombol Bookmark
- **Jadwal Rilis** — per hari SENIN–MINGGU + acak
- **Jelajahi** — Genre / Theme / Demographic (dengan poster), Tipe (Movie/ONA/OVA/Series/…),
  Tahun, Studio — semua bisa diklik jadi daftar anime berpaginasi
- **Pencarian** — kata kunci dengan muat-halaman bertahap
- **Bookmark & Riwayat** — tersimpan di localStorage perangkat

## Cara menjalankan
```bash
npm install
npm run dev        # http://localhost:3000
# produksi:
npm run build && npm start
```

## Arsitektur data
Semua request ke API AnimeIn (`xyz-api.animein.net`, domain diambil dinamis dari
`gate.nextanimelist.com`) dilakukan **di server** lewat Route Handlers di `app/api/*`
(lib: `lib/animein.js`, diadaptasi dari scraper APK AnimeIn 5.2.2) dengan
User-Agent `okhttp/4.9.3` agar tidak kena Cloudflare/CORS, plus cache Next.js.

> Catatan: ZIP source donghua asli tidak bisa diunduh dari sandbox build ini
> (CDN terblokir), jadi UI dibangun ulang mengikuti pola UI aplikasi donghua aslinya.

### Update lanjutan
- Saran pencarian live di navbar (poster + info singkat, debounce)
- Section **Just For You** di beranda (endpoint `data/home/fyp`)
- Filter genre multi-pilih + urutan Populer / A–Z di halaman daftar
- **Resume playback**: posisi video disimpan, lanjut otomatis saat episode dibuka lagi
  (progress bar muncul di "Lanjutkan Menonton")
- Manifest PWA (bisa di-install / Add to Home Screen)
