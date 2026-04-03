import { useMemo, useState } from "react";
import type { ApprovalRequest } from "../approvals";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import type { ShiftSession } from "../shift";
import type { Customer } from "../types";

type ReportsPanelProps = {
  sales: LocalSale[];
  shifts?: ShiftSession[];
  approvalRequests?: ApprovalRequest[];
  products?: ProductItem[];
  customers?: Customer[];
  exportEnabled?: boolean;
};

type ReportPeriod = "daily" | "weekly" | "monthly";

type ProductCount = {
  name: string;
  qty: number;
};

type PeriodSummary = {
  key: ReportPeriod;
  label: string;
  start: number;
  allSales: LocalSale[];
  completedSales: LocalSale[];
  revenue: number;
  trx: number;
  refundedCount: number;
  voidedCount: number;
  discountAmount: number;
  avgTicket: number;
  topProducts: ProductCount[];
  topSeller: string;
  growthPercent: number | null;
};

type ShiftReconciliationRow = {
  id: string;
  openedAt: string;
  closedAt?: string;
  status: "open" | "closed";
  openedByName?: string;
  closedByName?: string;
  openingCash: number;
  cashIn: number;
  cashOut: number;
  cashSalesTotal: number;
  expectedClosingCash: number;
  actualClosingCash: number | null;
  variance: number | null;
  movementCount: number;
  closingNote?: string;
};

const periodOptions: Array<{ key: ReportPeriod; label: string }> = [
  { key: "daily", label: "Harian" },
  { key: "weekly", label: "Mingguan" },
  { key: "monthly", label: "Bulanan" }
];

const SHIFT_VARIANCE_ALERT_THRESHOLD = 5000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function startOfWeek(date: Date) {
  const currentDay = date.getDay();
  const offsetToMonday = currentDay === 0 ? 6 : currentDay - 1;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offsetToMonday).getTime();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function escapeCsvValue(value: string | number) {
  const text = String(value ?? "");
  if (/[,"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPanel({
  sales,
  shifts = [],
  approvalRequests = [],
  products = [],
  customers = [],
  exportEnabled = true
}: ReportsPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("daily");

  const analytics = useMemo(() => {
    const now = new Date();
    const startDay = startOfDay(now);
    const startWeek = startOfWeek(now);
    const startMonth = startOfMonth(now);
    const dayMs = 24 * 60 * 60 * 1000;

    const previousStartDay = startDay - dayMs;
    const previousStartWeek = startWeek - 7 * dayMs;
    const previousStartMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousStartMonth = previousStartMonthDate.getTime();
    const previousEndMonth = startMonth;

    const summarize = (
      key: ReportPeriod,
      label: string,
      start: number,
      endExclusive: number | null,
      previousRevenue: number
    ): PeriodSummary => {
      const allSales = sales.filter((sale) => {
        const timestamp = new Date(sale.createdAt).getTime();
        if (timestamp < start) return false;
        if (endExclusive !== null && timestamp >= endExclusive) return false;
        return true;
      });

      const completedSales = allSales.filter((sale) => sale.status === "completed");
      const refundedCount = allSales.filter((sale) => sale.status === "refunded").length;
      const voidedCount = allSales.filter((sale) => sale.status === "voided").length;
      const revenue = completedSales.reduce((acc, sale) => acc + sale.total, 0);
      const discountAmount = completedSales.reduce((acc, sale) => acc + sale.discountAmount, 0);
      const trx = completedSales.length;
      const avgTicket = trx > 0 ? revenue / trx : 0;

      const productMap = new Map<string, number>();
      for (const sale of completedSales) {
        for (const item of sale.items) {
          productMap.set(item.name, (productMap.get(item.name) ?? 0) + item.qty);
        }
      }

      const topProducts: ProductCount[] = Array.from(productMap.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      return {
        key,
        label,
        start,
        allSales,
        completedSales,
        revenue,
        trx,
        refundedCount,
        voidedCount,
        discountAmount,
        avgTicket,
        topProducts,
        topSeller: topProducts[0]?.name ?? "-",
        growthPercent: previousRevenue <= 0 ? null : ((revenue - previousRevenue) / previousRevenue) * 100
      };
    };

    const previousDayRevenue = sales
      .filter((sale) => {
        const timestamp = new Date(sale.createdAt).getTime();
        return timestamp >= previousStartDay && timestamp < startDay && sale.status === "completed";
      })
      .reduce((acc, sale) => acc + sale.total, 0);

    const previousWeekRevenue = sales
      .filter((sale) => {
        const timestamp = new Date(sale.createdAt).getTime();
        return timestamp >= previousStartWeek && timestamp < startWeek && sale.status === "completed";
      })
      .reduce((acc, sale) => acc + sale.total, 0);

    const previousMonthRevenue = sales
      .filter((sale) => {
        const timestamp = new Date(sale.createdAt).getTime();
        return timestamp >= previousStartMonth && timestamp < previousEndMonth && sale.status === "completed";
      })
      .reduce((acc, sale) => acc + sale.total, 0);

    const daily = summarize("daily", "Harian", startDay, null, previousDayRevenue);
    const weekly = summarize("weekly", "Mingguan", startWeek, null, previousWeekRevenue);
    const monthly = summarize("monthly", "Bulanan", startMonth, null, previousMonthRevenue);

    return {
      daily,
      weekly,
      monthly
    };
  }, [sales]);

  const selectedSummary =
    selectedPeriod === "weekly"
      ? analytics.weekly
      : selectedPeriod === "monthly"
        ? analytics.monthly
        : analytics.daily;

  const shiftReconciliationRows = useMemo<ShiftReconciliationRow[]>(() => {
    const shiftInRange = shifts.filter(
      (shift) => new Date(shift.openedAt).getTime() >= selectedSummary.start
    );

    return shiftInRange
      .map((shift) => {
        const completedShiftSales = sales.filter(
          (sale) => sale.shiftId === shift.id && sale.status === "completed"
        );

        const cashSalesTotal = completedShiftSales.reduce((acc, sale) => {
          if (sale.paymentBreakdown) {
            return acc + Math.max(0, Number(sale.paymentBreakdown.cash || 0));
          }

          return sale.paymentMethod === "cash" ? acc + Math.max(0, Number(sale.total || 0)) : acc;
        }, 0);

        const cashIn = shift.movements.reduce((acc, movement) => {
          if (movement.type !== "in") return acc;
          return acc + Math.max(0, Number(movement.amount || 0));
        }, 0);

        const cashOut = shift.movements.reduce((acc, movement) => {
          if (movement.type !== "out") return acc;
          return acc + Math.max(0, Number(movement.amount || 0));
        }, 0);

        const expectedClosingCash = Math.max(0, Number(shift.openingCash || 0) + cashIn - cashOut + cashSalesTotal);
        const isClosed = Boolean(shift.closedAt);
        const actualClosingCash = isClosed ? Math.max(0, Number(shift.closingCash || 0)) : null;
        const variance = actualClosingCash === null ? null : Math.round(actualClosingCash - expectedClosingCash);

        return {
          id: shift.id,
          openedAt: shift.openedAt,
          closedAt: shift.closedAt,
          status: (isClosed ? "closed" : "open") as ShiftReconciliationRow["status"],
          openedByName: shift.openedByName,
          closedByName: shift.closedByName,
          openingCash: Math.max(0, Number(shift.openingCash || 0)),
          cashIn,
          cashOut,
          cashSalesTotal,
          expectedClosingCash,
          actualClosingCash,
          variance,
          movementCount: shift.movements.length,
          closingNote: shift.closingNote
        };
      })
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [selectedSummary.start, shifts, sales]);

  const shiftReconciliationStats = useMemo(() => {
    const total = shiftReconciliationRows.length;
    const open = shiftReconciliationRows.filter((row) => row.status === "open").length;
    const closed = total - open;
    const largeVariance = shiftReconciliationRows.filter(
      (row) => row.variance !== null && Math.abs(row.variance) >= SHIFT_VARIANCE_ALERT_THRESHOLD
    ).length;

    const closedRows = shiftReconciliationRows.filter((row) => row.variance !== null);
    const averageVarianceAbs =
      closedRows.length === 0
        ? 0
        : closedRows.reduce((acc, row) => acc + Math.abs(Number(row.variance || 0)), 0) / closedRows.length;

    return {
      total,
      open,
      closed,
      largeVariance,
      averageVarianceAbs
    };
  }, [shiftReconciliationRows]);

  const exportSalesCsv = () => {
    if (!exportEnabled) return;

    const header = [
      "id",
      "tanggal",
      "status",
      "metode",
      "outlet",
      "subtotal",
      "diskon",
      "total",
      "jumlah_item",
      "rincian_item"
    ];
    const rows = selectedSummary.allSales.map((sale) => {
      const itemCount = sale.items.reduce((acc, item) => acc + item.qty, 0);
      const itemDetail = sale.items.map((item) => `${item.name} x${item.qty}`).join("; ");
      return [
        escapeCsvValue(sale.id),
        escapeCsvValue(sale.createdAt),
        escapeCsvValue(sale.status),
        escapeCsvValue(sale.paymentMethod),
        escapeCsvValue(sale.outletId || "MAIN"),
        escapeCsvValue(sale.subtotal),
        escapeCsvValue(sale.discountAmount),
        escapeCsvValue(sale.total),
        escapeCsvValue(itemCount),
        escapeCsvValue(itemDetail)
      ].join(",");
    });

    const content = [header.join(","), ...rows].join("\n");
    downloadBlob(
      content,
      `laporan-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;"
    );
  };

  const exportAllDataJson = () => {
    if (!exportEnabled) return;

    const approvalInRange = approvalRequests.filter(
      (request) => new Date(request.createdAt).getTime() >= selectedSummary.start
    );
    const shiftsInRange = shifts.filter(
      (shift) => new Date(shift.openedAt).getTime() >= selectedSummary.start
    );

    const payload = {
      generatedAt: new Date().toISOString(),
      selectedPeriod,
      summaryByPeriod: {
        daily: {
          revenue: analytics.daily.revenue,
          trx: analytics.daily.trx,
          refundVoid: analytics.daily.refundedCount + analytics.daily.voidedCount
        },
        weekly: {
          revenue: analytics.weekly.revenue,
          trx: analytics.weekly.trx,
          refundVoid: analytics.weekly.refundedCount + analytics.weekly.voidedCount
        },
        monthly: {
          revenue: analytics.monthly.revenue,
          trx: analytics.monthly.trx,
          refundVoid: analytics.monthly.refundedCount + analytics.monthly.voidedCount
        }
      },
      selectedPeriodData: {
        sales: selectedSummary.allSales,
        approvals: approvalInRange,
        shifts: shiftsInRange,
        shiftReconciliation: shiftReconciliationRows
      },
      masterData: {
        products,
        customers
      }
    };

    downloadBlob(
      JSON.stringify(payload, null, 2),
      `data-lengkap-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json;charset=utf-8;"
    );
  };

  const exportShiftReconciliationCsv = () => {
    if (!exportEnabled) return;

    const header = [
      "id_shift",
      "status",
      "dibuka_pada",
      "ditutup_pada",
      "dibuka_oleh",
      "ditutup_oleh",
      "kas_awal",
      "kas_masuk",
      "kas_keluar",
      "tunai_transaksi",
      "saldo_ekspektasi",
      "saldo_aktual",
      "selisih",
      "jumlah_mutasi",
      "catatan_penutupan"
    ];

    const rows = shiftReconciliationRows.map((row) =>
      [
        escapeCsvValue(row.id),
        escapeCsvValue(row.status),
        escapeCsvValue(row.openedAt),
        escapeCsvValue(row.closedAt || ""),
        escapeCsvValue(row.openedByName || ""),
        escapeCsvValue(row.closedByName || ""),
        escapeCsvValue(Math.round(row.openingCash)),
        escapeCsvValue(Math.round(row.cashIn)),
        escapeCsvValue(Math.round(row.cashOut)),
        escapeCsvValue(Math.round(row.cashSalesTotal)),
        escapeCsvValue(Math.round(row.expectedClosingCash)),
        escapeCsvValue(row.actualClosingCash === null ? "" : Math.round(row.actualClosingCash)),
        escapeCsvValue(row.variance === null ? "" : row.variance),
        escapeCsvValue(row.movementCount),
        escapeCsvValue(row.closingNote || "")
      ].join(",")
    );

    const content = [header.join(","), ...rows].join("\n");
    downloadBlob(
      content,
      `rekonsiliasi-shift-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;"
    );
  };

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl bg-gradient-to-br from-primary to-primary-container px-5 py-6 text-on-primary editorial-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-fixed">Analisis Periode</p>
            <p className="mt-2 font-headline text-2xl font-extrabold sm:text-3xl">Laporan {selectedSummary.label}</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(event) => setSelectedPeriod(event.target.value as ReportPeriod)}
            className="h-10 rounded-xl border-none bg-white/20 px-3 text-xs font-semibold text-on-primary outline-none ring-1 ring-white/20"
          >
            {periodOptions.map((periodOption) => (
              <option key={periodOption.key} value={periodOption.key} className="text-black">
                {periodOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <p className="rounded-xl bg-white/10 px-3 py-2 text-xs">
            Omzet
            <span className="mt-1 block font-headline text-lg font-bold text-on-primary">Rp {Math.round(selectedSummary.revenue).toLocaleString("id-ID")}</span>
          </p>
          <p className="rounded-xl bg-white/10 px-3 py-2 text-xs">
            Transaksi
            <span className="mt-1 block font-headline text-lg font-bold text-on-primary">{selectedSummary.trx}</span>
          </p>
          <p className="rounded-xl bg-white/10 px-3 py-2 text-xs">
            Avg Ticket
            <span className="mt-1 block font-headline text-lg font-bold text-on-primary">Rp {Math.round(selectedSummary.avgTicket).toLocaleString("id-ID")}</span>
          </p>
          <p className="rounded-xl bg-white/10 px-3 py-2 text-xs">
            Refund + Void
            <span className="mt-1 block font-headline text-lg font-bold text-on-primary">{selectedSummary.refundedCount + selectedSummary.voidedCount}</span>
          </p>
        </div>

        {selectedSummary.growthPercent !== null && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-secondary-container">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {selectedSummary.growthPercent >= 0 ? "+" : ""}
            {selectedSummary.growthPercent.toFixed(1)}% vs periode sebelumnya
          </p>
        )}
      </article>

      <section className="grid gap-3 sm:grid-cols-3">
        {[analytics.daily, analytics.weekly, analytics.monthly].map((item) => (
          <article key={item.key} className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{item.label}</p>
            <p className="mt-2 font-headline text-xl font-extrabold text-primary">Rp {Math.round(item.revenue).toLocaleString("id-ID")}</p>
            <p className="text-xs text-on-surface-variant">{item.trx} transaksi valid</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Pertumbuhan: {item.growthPercent === null ? "-" : `${item.growthPercent >= 0 ? "+" : ""}${item.growthPercent.toFixed(1)}%`}
            </p>
          </article>
        ))}
      </section>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Ekspor Manajemen Data</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportSalesCsv}
              disabled={!exportEnabled}
              className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-primary-fixed-variant disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportShiftReconciliationCsv}
              disabled={!exportEnabled}
              className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-primary-fixed-variant disabled:opacity-50"
            >
              Export Rekonsiliasi Shift
            </button>
            <button
              type="button"
              onClick={exportAllDataJson}
              disabled={!exportEnabled}
              className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary disabled:opacity-50"
            >
              Export Semua Data (JSON)
            </button>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
          Ekspor mendukung laporan harian, mingguan, dan bulanan. File JSON akan menyertakan data transaksi pada periode terpilih plus master data produk dan pelanggan.
        </p>
        {!exportEnabled && (
          <p className="mt-2 rounded-xl bg-error-container/60 px-3 py-2 text-xs font-semibold text-on-error-container">
            Fitur ekspor dinonaktifkan owner untuk akun manager.
          </p>
        )}
      </article>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Rekonsiliasi Kas Shift</h3>
          <span className="rounded-full bg-secondary-container px-2.5 py-1 text-[11px] font-bold text-on-secondary-container">
            {shiftReconciliationStats.total} shift
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
            Shift Terbuka
            <span className="mt-1 block font-headline text-lg font-bold text-on-surface">{shiftReconciliationStats.open}</span>
          </p>
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
            Shift Ditutup
            <span className="mt-1 block font-headline text-lg font-bold text-on-surface">{shiftReconciliationStats.closed}</span>
          </p>
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
            Selisih Besar
            <span className="mt-1 block font-headline text-lg font-bold text-rose-700">{shiftReconciliationStats.largeVariance}</span>
          </p>
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
            Rata2 Selisih
            <span className="mt-1 block font-headline text-lg font-bold text-on-surface">
              Rp {Math.round(shiftReconciliationStats.averageVarianceAbs).toLocaleString("id-ID")}
            </span>
          </p>
        </div>

        <ul className="mt-3 grid gap-2">
          {shiftReconciliationRows.length === 0 && (
            <li className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Belum ada data shift pada periode ini.
            </li>
          )}

          {shiftReconciliationRows.slice(0, 6).map((row) => {
            const isLargeVariance = row.variance !== null && Math.abs(row.variance) >= SHIFT_VARIANCE_ALERT_THRESHOLD;
            return (
              <li key={row.id} className="rounded-xl bg-surface-container-lowest p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-headline text-base font-bold text-on-surface">{row.id}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      row.status === "open"
                        ? "bg-amber-100 text-amber-800"
                        : isLargeVariance
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {row.status === "open" ? "Aktif" : isLargeVariance ? "Selisih Tinggi" : "Normal"}
                  </span>
                </div>

                <p className="mt-1 text-xs text-on-surface-variant">
                  {new Date(row.openedAt).toLocaleString("id-ID")}
                  {row.closedAt ? ` • ditutup ${new Date(row.closedAt).toLocaleString("id-ID")}` : " • belum ditutup"}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                    Kas Awal
                    <span className="mt-0.5 block font-semibold text-on-surface">Rp {Math.round(row.openingCash).toLocaleString("id-ID")}</span>
                  </p>
                  <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                    Tunai Transaksi
                    <span className="mt-0.5 block font-semibold text-on-surface">Rp {Math.round(row.cashSalesTotal).toLocaleString("id-ID")}</span>
                  </p>
                  <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                    Kas Kecil (Net)
                    <span className="mt-0.5 block font-semibold text-on-surface">
                      {(row.cashIn - row.cashOut) >= 0 ? "+" : "-"}Rp {Math.abs(Math.round(row.cashIn - row.cashOut)).toLocaleString("id-ID")}
                    </span>
                  </p>
                  <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                    Selisih
                    <span
                      className={`mt-0.5 block font-semibold ${
                        row.variance === null
                          ? "text-on-surface"
                          : row.variance === 0
                            ? "text-emerald-700"
                            : isLargeVariance
                              ? "text-rose-700"
                              : "text-amber-700"
                      }`}
                    >
                      {row.variance === null
                        ? "-"
                        : `${row.variance >= 0 ? "+" : "-"}Rp ${Math.abs(row.variance).toLocaleString("id-ID")}`}
                    </span>
                  </p>
                </div>

                <p className="mt-2 text-xs text-on-surface-variant">
                  Ekspektasi Rp {Math.round(row.expectedClosingCash).toLocaleString("id-ID")}
                  {row.actualClosingCash === null ? " • Aktual: -" : ` • Aktual Rp ${Math.round(row.actualClosingCash).toLocaleString("id-ID")}`}
                  {row.movementCount > 0 ? ` • ${row.movementCount} mutasi` : " • tanpa mutasi"}
                </p>

                {row.closingNote && (
                  <p className="mt-1 rounded-lg bg-surface-container-low px-2 py-1 text-xs text-on-surface-variant">
                    Catatan: {row.closingNote}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {shiftReconciliationRows.length > 6 && (
          <p className="mt-2 text-xs text-on-surface-variant">
            Menampilkan 6 data terbaru dari {shiftReconciliationRows.length} shift pada periode ini.
          </p>
        )}
      </article>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-surface-container-low p-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Produk Terlaris {selectedSummary.label}</h3>
            <span className="text-xs font-bold text-primary">Top {selectedSummary.topProducts.length}</span>
          </div>
          <ul className="mt-3 grid gap-2">
            {selectedSummary.topProducts.length === 0 && (
              <li className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
                Belum ada transaksi valid pada periode ini.
              </li>
            )}
            {selectedSummary.topProducts.map((product, index) => (
              <li key={`${product.name}-${index}`} className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3">
                <p className="text-sm font-semibold text-on-surface">{index + 1}. {product.name}</p>
                <span className="rounded-full bg-secondary-container px-2.5 py-1 text-[11px] font-bold text-on-secondary-container">
                  {product.qty} unit
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Aktivitas Terbaru</h3>
            <span className="text-xs font-bold text-primary">{selectedSummary.allSales.length} data</span>
          </div>
          <ul className="mt-3 grid gap-2">
            {selectedSummary.allSales.length === 0 && (
              <li className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
                Belum ada aktivitas pada periode ini.
              </li>
            )}
            {selectedSummary.allSales.slice(0, 5).map((sale) => (
              <li key={sale.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-surface-container-lowest p-3">
                <div>
                  <p className="font-headline text-base font-bold text-on-surface">{sale.id}</p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(sale.createdAt).toLocaleString("id-ID")} • {sale.paymentMethod.toUpperCase()} • {sale.status.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-headline text-lg font-bold text-on-surface">Rp {sale.total.toLocaleString("id-ID")}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  );
}
