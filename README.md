# NIHNIME — Anime Sub Indo

NIHNIME mengadaptasi tampilan source Astro/donghua yang disediakan ke aplikasi anime berbasis Next.js. Tata letak asli—navbar dan footer, carousel, kartu, sidebar, breadcrumb, detail, daftar episode, serta pemutar—dipertahankan; data diambil melalui adaptor API AnimeIn berdasarkan scraper yang disediakan.

## Menjalankan

Gunakan Node.js `^20.19`, `^22.13`, atau `>=24`.

```bash
npm ci
npm run dev                 # http://localhost:3000
npm test                    # tes adaptor, A–Z, demo, dan tipe server video
npm run lint
npm run build
npm start
```

Stack dipin ke Next.js 16.4.6, React 19.3.1, dan Tailwind CSS 4.3.5. Lihat [DEPLOY.md](DEPLOY.md) untuk deployment.

### Preview tanpa akses ke AnimeIn

Mode demo harus **diaktifkan secara eksplisit**, dan seluruh daftar dalam mode ini merupakan contoh, bukan data terkini:

```bash
NIHNIME_DEMO=1 npm run dev
```

Mode ini memakai ID `demo-*`, menampilkan pemberitahuan, dan menggunakan video contoh. ID anime/episode nyata tidak pernah diam-diam diganti dengan judul atau video demo, bahkan saat mode demo aktif. Tanpa variabel tersebut, kegagalan API ditampilkan sebagai kesalahan yang dapat dicoba ulang.

## Fitur

- Beranda episode terbaru dan anime selesai, navigasi responsif, pencarian, tema terang/gelap, daftar genre, tahun, dan A–Z.
- Detail anime dengan sinopsis, informasi yang tersedia, pencarian dan pemuatan episode bertahap, serta bookmark lokal.
- Pemutar dengan pilihan server yang dikelompokkan per kualitas, navigasi episode, riwayat lokal, dan penyimpanan progres untuk video langsung. Server `direct` memakai elemen video; server `semi`/embed memakai iframe.
- Halaman ongoing, completed, recent, jadwal, genre, tahun/season, studio, tipe, pencarian, history, dan bookmark. Rute lama `/nonton`, `/jadwal`, dan `/pencarian` tetap didukung.

## Data dan batasan

Request ke AnimeIn dilakukan di server melalui `app/api/*` dan `lib/animein.js`, termasuk penemuan domain API, User-Agent dari scraper, retry, dan cache. Browser memanggil rute relatif milik aplikasi, sehingga tidak perlu memanggil `localhost` atau API eksternal secara langsung untuk data. Poster dan media tetap dimuat dari penyedia pihak ketiga.

- Ketersediaan judul, poster, server dan pemutaran bergantung pada AnimeIn dan host video; katalog upstream dapat memuat konten selain anime Jepang.
- AnimeIn tidak menyediakan tautan unduhan batch atau skor dalam respons yang digunakan. Halaman `/batch` mengarah ke daftar anime selesai dan skor yang tidak tersedia ditampilkan sebagai `N/A`.
- Endpoint katalog tidak menyediakan filter status; halaman ongoing/completed memfilter setiap halaman hasil upstream, sehingga sebuah halaman bisa sedikit atau kosong meskipun halaman berikutnya memiliki hasil.
- Pencarian A–Z menggunakan hasil pencarian substring yang diurutkan upstream, lalu memfilter huruf awal. Ketepatan navigasi halaman bergantung pada konsistensi urutan alfabet dari AnimeIn.
- Riwayat, bookmark, dan progres disimpan di localStorage perangkat, bukan disinkronkan antarperangkat.

Aplikasi ini tidak menyimpan berkas video. Pastikan penggunaan konten pihak ketiga sesuai hak dan ketentuan yang berlaku.
