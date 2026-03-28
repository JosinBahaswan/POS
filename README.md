# POS SaaS Monorepo

Monorepo awal untuk sistem POS offline-first + portal web.

## Apps

- apps/pos: React + Vite + PWA untuk kasir
- apps/web: Next.js untuk dashboard owner dan landing page

## Fungsi Folder Web

- apps/web dipakai untuk panel owner atau manager (monitor omzet, subscription, dan API internal), bukan untuk transaksi kasir harian.
- Kasir fokus di apps/pos agar cepat dan tetap jalan saat koneksi tidak stabil.
- Jika apps/web error `Cannot find module './756.js'`, biasanya cache `.next` stale. Hapus folder `apps/web/.next` lalu jalankan ulang `npm run dev:web`.

## Environment

- Copy env examples:
	- apps/pos/.env.example menjadi apps/pos/.env
	- apps/web/.env.example menjadi apps/web/.env.local

Contoh minimal POS auth:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`VITE_TENANT_ID` hanya dipakai fallback untuk mode lama. Untuk mode baru multi-perusahaan, tenant diambil dari akun login.

## Development

1. npm install
2. npm run dev:pos
3. npm run dev:web

Catatan:

- Jika POS gagal start karena port 5173 sudah dipakai, sekarang Vite otomatis pindah ke port lain.
- Jika web jalan di port 3001, itu normal saat 3000 sedang dipakai proses lain.

## Quality Gate

- npm run check
- npm run build

## Production Readiness

- Database schema dan RLS: supabase/migrations/202603280001_init.sql
- Onboarding auth multi-company dan multi-kasir: supabase/migrations/202603280002_auth_onboarding.sql
- Owner management akun kasir/manager: supabase/migrations/202603280003_owner_staff_management.sql
- Fix ambiguity `tenant_id` pada profil RLS: supabase/migrations/202603280004_fix_profiles_tenant_ambiguity.sql
- Fix ambiguity `tenant_id` pada function register_owner: supabase/migrations/202603280005_fix_register_owner_function_ambiguity.sql
- Health endpoint web: /api/health
- Checklist operasional: docs/PRODUCTION.md

## Multi Kasir dan Multi Perusahaan

- Owner daftar perusahaan baru melalui form `Daftar Owner` di POS login screen.
- Owner membuat akun kasir dan manager lewat menu `Pengguna` (owner only).
- Kasir dan manager tidak perlu daftar, hanya login dengan akun yang dibuat owner.
- Manager: akses kasir + CRUD produk + laporan.
- Kasir: akses kasir saja.
- Data perusahaan A tidak akan tercampur dengan perusahaan B karena isolasi tenant + RLS.

