# Deploy NIHNIME ke Vercel

Tidak butuh environment variable apa pun. Semua request ke API AnimeIn
dilakukan server-side oleh Next.js (Route Handlers di `app/api/*`).

## Cara 1 — Import dari GitHub (disarankan)
1. Buka https://vercel.com/new dan login pakai akun GitHub.
2. Pilih repository **bluep0chi/nihnime** → **Import**.
3. Framework akan terdeteksi otomatis: **Next.js**. Jangan ubah apa pun:
   - Build Command: `next build`
   - Install Command: `npm install`
   - Root Directory: `./`
4. Klik **Deploy**. Selesai dalam ±1 menit, dapat URL `*.vercel.app`.

> Catatan branch: kode aplikasi ada di branch `arena/f27184bc-nihnime`.
> Merge PR dari branch ini ke `main` dulu supaya `main` berisi aplikasinya,
> **atau** di Vercel buka **Settings → Git → Production Branch** lalu pilih
> `arena/f27184bc-nihnime`.

## Cara 2 — Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Setelah deploy
- Setiap `git push` ke branch production akan otomatis re-deploy.
- Preview deployment otomatis dibuat untuk branch/PR lain.
