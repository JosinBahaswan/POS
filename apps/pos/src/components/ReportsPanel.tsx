import { useMemo } from "react";
import type { LocalSale } from "../database";

type ReportsPanelProps = {
  sales: LocalSale[];
};

type ProductCount = {
  name: string;
  qty: number;
};

export function ReportsPanel({ sales }: ReportsPanelProps) {
  const report = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startYesterday = startToday - 24 * 60 * 60 * 1000;

    const todaySalesAll = sales.filter((sale) => new Date(sale.createdAt).getTime() >= startToday);
    const yesterdaySalesAll = sales.filter((sale) => {
      const createdAt = new Date(sale.createdAt).getTime();
      return createdAt >= startYesterday && createdAt < startToday;
    });

    const todaySales = todaySalesAll.filter((sale) => sale.status === "completed");
    const yesterdaySales = yesterdaySalesAll.filter((sale) => sale.status === "completed");
    const refundedCount = todaySalesAll.filter((sale) => sale.status === "refunded").length;
    const voidedCount = todaySalesAll.filter((sale) => sale.status === "voided").length;

    const omzet = todaySales.reduce((acc, sale) => acc + sale.total, 0);
    const yesterdayOmzet = yesterdaySales.reduce((acc, sale) => acc + sale.total, 0);
    const trx = todaySales.length;

    const map = new Map<string, number>();
    for (const sale of todaySales) {
      for (const item of sale.items) {
        map.set(item.name, (map.get(item.name) ?? 0) + item.qty);
      }
    }

    const topProducts: ProductCount[] = Array.from(map.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const topSeller = topProducts[0]?.name ?? "-";
    const growth =
      yesterdayOmzet <= 0
        ? null
        : ((omzet - yesterdayOmzet) / yesterdayOmzet) * 100;

    return { omzet, trx, topProducts, topSeller, growth, todaySales, refundedCount, voidedCount };
  }, [sales]);

  const exportCsv = () => {
    const header = "id,tanggal,metode,total,subtotal,diskon";
    const rows = report.todaySales.map((sale) =>
      [sale.id, sale.createdAt, sale.paymentMethod, sale.total, sale.subtotal, sale.discountAmount].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-harian-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="grid gap-4">
      <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-container px-5 py-6 text-on-primary editorial-shadow">
        <div className="absolute -right-6 -top-6 opacity-10">
          <span className="material-symbols-outlined text-[120px]">payments</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-fixed">Total Omzet</p>
        <p className="mt-2 font-headline text-2xl font-extrabold sm:text-3xl">Rp {report.omzet.toLocaleString("id-ID")}</p>
        {report.growth !== null && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-secondary-container">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {report.growth >= 0 ? "+" : ""}
            {report.growth.toFixed(1)}% vs kemarin
          </p>
        )}
      </article>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-container-low text-primary">
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Transaksi</p>
          <p className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">{report.trx}</p>
          <p className="mt-1 text-xs text-on-surface-variant">Refund/Void: {report.refundedCount + report.voidedCount}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-tertiary-fixed/40 text-on-tertiary-fixed-variant">
            <span className="material-symbols-outlined">star</span>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Produk Terlaris</p>
          <p className="font-headline text-xl font-bold text-on-surface sm:text-2xl">{report.topSeller}</p>
        </article>
      </div>

      <article className="rounded-2xl bg-surface-container-low p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Ekspor Laporan</h2>
          <button
            type="button"
            onClick={exportCsv}
            className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-primary-fixed-variant"
          >
            Export CSV
          </button>
        </div>
        <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
          Gunakan tombol ekspor untuk mengunduh transaksi hari ini dalam format CSV.
        </p>
      </article>

      <article className="rounded-2xl bg-surface-container-low p-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Aktivitas Terbaru</h2>
          <span className="text-xs font-bold text-primary">Lihat Riwayat</span>
        </div>

        <ul className="mt-3 grid gap-2">
          {report.topProducts.length === 0 && (
            <li className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Belum ada penjualan hari ini.
            </li>
          )}
          {report.todaySales.slice(0, 5).map((sale) => (
            <li key={sale.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-surface-container-lowest p-3">
              <div>
                <p className="font-headline text-base font-bold text-on-surface">{sale.id}</p>
                <p className="text-xs text-on-surface-variant">{new Date(sale.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {sale.paymentMethod.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-headline text-lg font-bold text-on-surface">Rp {sale.total.toLocaleString("id-ID")}</p>
                <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-secondary-container">
                  Lunas
                </span>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
