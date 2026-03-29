# Implementation Progress (Production Track)

Last update: 2026-03-29

## Objective

Menyiapkan POS agar siap production dengan pembagian tanggung jawab yang jelas per role: kasir, manajer, owner.
Dokumen ini adalah sumber progres implementasi. UI tidak dipakai untuk menampilkan status roadmap.

## Role Scope Matrix

| Capability | Kasir | Manajer | Owner |
|---|---|---|---|
| Buat transaksi | Yes | Monitor | Monitor |
| Scan/cari produk | Yes | Yes | Monitor |
| Hold-resume order | Yes | Monitor | Monitor |
| Pilih metode bayar | Yes | Monitor | Monitor |
| Split payment | Yes | Policy | Policy |
| Cetak struk | Yes | Yes | Monitor |
| Buka-tutup shift | Yes | Review | Monitor |
| Kas masuk/keluar kecil | Yes | Approve | Policy |
| Kelola produk & stok | View | Yes | Policy |
| Kelola pengguna | No | No | Yes |
| Analytics bisnis | Basic | Ops | Strategic |

## Cashier Workstream

### Core Checkout

- [x] Buat transaksi dari katalog
- [x] Cari produk berdasarkan nama/SKU
- [x] Hold-resume order
- [x] Pilih metode bayar (cash/card/qris)
- [x] Cetak struk dari riwayat
- [x] Split payment per transaksi (checkout + validasi nominal + struk)

### Shift & Cash Control

- [x] Open shift (saldo awal)
- [x] Close shift (rekap kas akhir + selisih)
- [x] Input kas masuk kecil (cash in)
- [x] Input kas keluar kecil (cash out)
- [x] Log alasan untuk cash in/out

### Risk Control

- [x] Refund/void dengan alasan (request flow dari riwayat kasir)
- [x] Approval manager/owner untuk aksi sensitif (diskon besar, refund, void)
- [x] Audit trail aksi operasional (produk, approval, shift, user, checkout)

## Manager Workstream

- [x] Kelola produk-harga-promo
- [x] Approval refund/void/diskon besar
- [x] Monitoring performa kasir per shift
- [x] Stock opname + restock operasional
- [x] Laporan harian operasional

## Owner Workstream

- [x] Kelola akun pengguna (owner > staf)
- [x] Analytics lanjutan (omzet, margin, tren)
- [x] Laporan periodik (7 hari, 30 hari, bulan ini + export CSV)
- [x] Pengaturan policy approval lintas role
- [x] Audit log operasional
- [x] Perbandingan cabang/outlet (aktif saat data multi outlet tersedia)

## Current Sprint Focus

1. Hardening edge case approval lintas-device (saat backend approval real-time aktif).
2. Tambah guard policy server-side agar rule approval konsisten lintas terminal.
3. Siapkan integrasi barcode scanner hardware dan workflow supplier PO.

## Production Gates (Before Go-Live)

- [ ] Quality gate: `npm run check` + `npm run build`
- [ ] Security review RLS dan service-role isolation
- [ ] Offline-first simulation (network drop/recover)
- [ ] E2E test skenario kasir harian
- [ ] Backup & restore drill berhasil