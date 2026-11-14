# Deploy NIHNIME ke Vercel

Aplikasi menggunakan Next.js Route Handlers untuk mengakses AnimeIn di server. Produksi tidak memerlukan variabel lingkungan untuk data nyata; jangan set `NIHNIME_DEMO=1` di produksi kecuali memang ingin seluruh katalog contoh.

1. Hubungkan repositori `bluep0chi/nihnime` ke proyek Vercel yang ada, atau impor repositori ke proyek baru.
2. Pilih framework **Next.js**, root directory `./`, dan versi Node yang kompatibel (`^20.19`, `^22.13`, atau `>=24`).
3. Gunakan install command `npm ci` dan build command `npm run build` (default proyek juga dapat digunakan).
4. Deploy commit yang diinginkan. Periksa status deployment dan kunjungi domain proyek setelah siap.

```bash
npm ci
npm test
npm run lint
npm run build
```

Jika API upstream tidak dapat dijangkau dari region deployment, aplikasi menampilkan pesan kesalahan, bukan konten contoh. Ketersediaan server video dan pemutaran harus diperiksa secara terpisah di browser karena keduanya bergantung pada host pihak ketiga.
