# Production Checklist

## 1) Infra dan Environment

- Gunakan Node.js 20+
- Set environment sesuai file contoh:
  - apps/pos/.env.example
  - apps/web/.env.example
- Untuk dashboard ringkasan, isi NEXT_PUBLIC_DEMO_TENANT_ID di apps/web/.env.local
- Pisahkan env staging dan production

## 2) Database dan Security

- Jalankan migration SQL pada folder supabase/migrations
- Pastikan Row Level Security aktif di semua tabel tenant data
- Simpan service-role key hanya di server, jangan di client

## 3) Release Process

- Jalankan quality gate lokal:
  - npm run check
  - npm run build
- Deploy apps/web ke Vercel
- Deploy apps/pos sebagai static build (Vercel/Cloudflare Pages)

## 4) Operasional

- Health check endpoint: /api/health
- Dashboard summary endpoint: /api/dashboard-summary?tenantId=<uuid>
- Pantau error frontend menggunakan Sentry atau alternatif
- Simulasikan mode offline sebelum setiap release

## 5) Backup dan Audit

- Aktifkan backup harian database
- Simpan audit log transaksi minimal 90 hari
- Uji restore backup minimal 1x per bulan
