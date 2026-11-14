# NIHNIME — Anime Sub Indo

NIHNIME mengadaptasi tampilan source Astro/donghua yang disediakan ke aplikasi anime berbasis Next.js. Tata letak asli—navbar dan footer, carousel, kartu, sidebar, breadcrumb, detail, daftar episode, serta pemutar—dipertahankan; data diambil melalui adaptor API AnimeIn berdasarkan scraper yang disediakan.

## Menjalankan

Gunakan Node.js `^20.19`, `^22.13`, atau `>=24`.

```bash
npm ci
npm run dev                 # http://localhost:3000
npm test                    # tes adaptor, presentasi, pagination, demo, dan server video
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

### Tes tampilan pemutar

Jalankan `npm run dev` di satu terminal. Di terminal lain, instal browser sekali dan jalankan tes:

```bash
npx playwright-core install chromium
npm run test:watch-ui
```

Tes ini menggunakan respons API dan video lokal berukuran kecil untuk memeriksa tema, tata letak, kontrol sentuh, intro, dan navigasi; tes ini tidak membuktikan ketersediaan video penyedia. Jika server memakai alamat lain, tetapkan `WATCH_TEST_BASE_URL`. Browser Chromium yang sudah ada dapat dipilih lewat `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Fitur

- Beranda episode terbaru, anime selesai, serta pilihan Sedang Hangat, Paling Populer, dan Judul Baru dari AnimeIn. Navigasi responsif, pencarian, tema terang/gelap, dan daftar A–Z mengikuti gaya source asli.
- Jelajahi genre, tema, demografi, tahun/season, studio, dan tipe yang tersedia dari penyedia. Jadwal memuat hari yang dipilih saja, dimulai dari hari ini di WIB; tautan `/schedule?day=JUMAT` juga didukung.
- Detail menampilkan informasi yang tersedia, season terkait, episode awal/terbaru, pencarian dan pemuatan episode bertahap, serta bookmark lokal.
- Pemutar video langsung NIHNIME dengan pilihan server/kualitas, putar/jeda, geser waktu, mundur/maju 10 detik, volume, kecepatan, layar penuh, picture-in-picture bila didukung, dan progres lokal. HLS memakai dukungan native atau hls.js bila host mengizinkan CORS. Saat area pemutar difokuskan, gunakan Spasi/K untuk putar/jeda, panah kiri/kanan untuk geser, M untuk suara, dan F untuk layar penuh.
- Tombol **Lewati Intro** muncul hanya selama opening yang memiliki data per episode dan cocok dengan video yang sedang diputar. Waktunya berasal dari kontribusi AniSkip, bukan durasi tetap atau tebakan; identitas season, nomor episode, dan durasi dicocokkan ulang setiap kali berganti server. Pengguna memilih sendiri apakah akan melewatinya.
- Server `semi`/embed tetap memakai iframe pihak ketiga. NIHNIME tidak dapat mengontrol intro atau menyimpan progresnya. Pesan kegagalan dan tombol muat ulang tersedia untuk video langsung.
- Halaman ongoing, completed, recent, jadwal, kategori, pencarian, history, dan bookmark. Item riwayat atau bookmark dapat dihapus satu per satu. Rute lama `/nonton`, `/jadwal`, dan `/pencarian` tetap didukung.

## Data dan batasan

Request ke AnimeIn dilakukan di server melalui `app/api/*` dan `lib/animein.js`, termasuk penemuan domain API, User-Agent dari scraper, retry, dan cache. Browser memanggil rute relatif milik aplikasi, sehingga tidak perlu memanggil `localhost` atau API eksternal secara langsung untuk data. Poster dan media tetap dimuat dari penyedia pihak ketiga.

- Ketersediaan judul, poster, server dan pemutaran bergantung pada AnimeIn dan host video; katalog upstream dapat memuat konten selain anime Jepang. Jika video langsung gagal, pemutar menampilkan pesan untuk mencoba server lain bila tersedia.
- Untuk intro, server mencocokkan judul, tanggal mulai tayang, tipe, season dan nomor episode AnimeIn dengan Kitsu/MyAnimeList, lalu meminta interval opening episode tersebut dari AniSkip. Hanya interval `op` dengan durasi sumber dalam satu detik dari durasi video yang diterima; episode spesial, data ambigu, runtime tidak diketahui, atau respons tidak cocok tidak menghasilkan tombol. Kesesuaian durasi tidak membuktikan bahwa dua rilis memiliki edit yang identik: waktu AniSkip berasal dari komunitas dan masih dapat berbeda pada versi video tertentu. Intro tidak dilewati otomatis.
- Jika gambar AnimeIn gagal dimuat atau kosong, judul dan tahun mulai tayang (`aired_start`) dikirim ke Kitsu untuk mencari gambar cadangan. Kolom `year` AnimeIn tidak dipakai untuk pencocokan karena bisa menunjukkan tahun pembaruan, bukan tahun tayang. Gambar hanya digunakan bila hasil cocok dan tidak ambigu; jika tidak, placeholder netral ditampilkan. Layanan dan gambar cadangan juga bergantung pada pihak ketiga.
- Endpoint episode terbaru dan pilihan beranda tertentu menerima batas jumlah, bukan nomor halaman. Halaman tersebut membagi paling banyak 300 hasil dan urutannya dapat berubah di upstream.
- AnimeIn tidak menyediakan tautan unduhan terpisah/batch atau skor dalam respons yang digunakan. Halaman `/batch` mengarah ke daftar anime selesai, dan skor yang tidak tersedia tidak ditampilkan.
- Endpoint katalog tidak menyediakan filter status. Halaman ongoing/completed memeriksa sampai enam halaman upstream per halaman tampilan dan menyimpan posisi untuk halaman berikutnya. Halaman masih bisa sedikit atau kosong jika status yang dicari jarang, dan urutan dapat berubah jika katalog upstream diperbarui.
- Kategori tahun mengikuti data AnimeIn; kolom `year` dapat menunjukkan tahun pembaruan, bukan tahun mulai tayang. Detail memakai `aired_start`/`aired_end` jika tersedia.
- Pencarian A–Z menggunakan hasil pencarian substring yang diurutkan upstream, lalu memfilter huruf awal. Ketepatan navigasi halaman bergantung pada konsistensi urutan alfabet dari AnimeIn.
- Riwayat, bookmark, dan progres disimpan di localStorage perangkat, bukan disinkronkan antarperangkat.

Aplikasi ini tidak menyimpan berkas video. Pastikan penggunaan konten pihak ketiga sesuai hak dan ketentuan yang berlaku.
