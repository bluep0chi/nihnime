# NIHNIME — Aplikasi Streaming Anime Sub Indo

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bluep0chi/nihnime)

> Panduan deploy lengkap: lihat [DEPLOY.md](DEPLOY.md)

Versi anime dari aplikasi donghua: **UI dipertahankan** (tema gelap, hero banner slider,
row poster geser, navigasi atas + bottom-nav mobile, halaman detail & player) tapi seluruh
konten diganti dari donghua menjadi **anime** memakai API AnimeIn, dan di-upgrade ke
stack terbaru: **Next.js 16.4.6, React 19.3.1, Tailwind CSS 4.3.5, lucide-react 1.72.0, Node ≥20.9**.

## Fitur
- **Beranda** — banner slider otomatis, Episode Baru, Sedang Hangat, Paling Populer (ranking),
  Jadwal Hari Ini, Judul Baru, Paling Dinanti, Acak, Just For You, + *Lanjutkan Menonton* dari riwayat lokal
- **Nonton** — player video bawaan, pilih server/kualitas (360p–1080p), episode Prev/Next,
  daftar episode, riwayat tontonan tersimpan otomatis
- **Detail anime** — sinopsis, info studio/tahun/status, cari nomor episode, muat episode
  bertahap, season/sekuel terkait, tombol Bookmark
- **Jadwal Rilis** — per hari SENIN–MINGGU + acak
- **Jelajahi** — Genre / Theme / Demographic (dengan poster), Tipe (Movie/ONA/OVA/Series/…),
  Tahun, Studio — semua bisa diklik jadi daftar anime berpaginasi
- **Pencarian** — kata kunci dengan muat-halaman bertahap + saran live di navbar
- **Bookmark & Riwayat** — tersimpan di localStorage perangkat, resume playback otomatis

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
(lib: `lib/animein.js`, diadaptasi 1:1 dari scraper `animein.js` / `AnimeScraper`
hasil sniff APK ANIMEIN 5.2.2) dengan User-Agent `okhttp/4.9.3` agar tidak kena
Cloudflare/CORS, retry 3x, plus cache Next.js.

Endpoint yang dipakai (sesuai scraper):
`data/home/list`, `data/home/list_new_episode`, `data/home/fyp`, `data/trailer/list`,
`3/2/home/{hot,new,popular,random}`, `3/2/schedule/data`, `3/2/explore/{data,genre,year}`,
`3/2/explore/movie{,_genre,_studio,_year,_type}`, `3/2/movie/detail/{id}`,
`3/2/movie/episode/{id}`, `3/2/episode/streamnew/{id}`.

> Mode demo: kalau API tidak terjangkau dari server (mis. sandbox/preview yang
> outbound-nya dibatasi), app otomatis menampilkan data contoh dari `lib/demo.js`
> dengan badge kuning — UI tetap bisa dilihat. Di Vercel data asli dimuat normal.

> Catatan: ZIP source donghua asli tidak bisa diunduh dari sandbox build ini
> (CDN terblokir), jadi UI dibangun ulang mengikuti pola UI aplikasi donghua aslinya.
