import { useMemo } from "react";
import type { LocalSale } from "../../database";
import type { ShiftSession } from "../../shift";

type Props = {
  sales: LocalSale[];
  shifts: ShiftSession[];
};

export function OwnerAnalyticsStaffPerformance({ sales, shifts }: Props) {
  const shiftCashierLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    for (const shift of shifts) {
      const cashierName = shift.openedByName?.trim() || shift.openedById?.trim();
      if (!cashierName) continue;
      lookup[shift.id] = cashierName;
    }
    return lookup;
  }, [shifts]);

  const staffStats = useMemo(() => {
    const stats: Record<string, { trxCount: number; omzet: number }> = {};
    for (const sale of sales) {
      if (sale.status !== "completed") continue;

      const cashierFromSale = sale.cashierName?.trim() || sale.cashierId?.trim();
      const cashierFromShift = sale.shiftId ? shiftCashierLookup[sale.shiftId]?.trim() : "";
      const cashierStr = cashierFromSale || cashierFromShift || "Unknown";

      if (!stats[cashierStr]) stats[cashierStr] = { trxCount: 0, omzet: 0 };
      stats[cashierStr].trxCount += 1;
      stats[cashierStr].omzet += sale.total;
    }
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.omzet - a.omzet);
  }, [sales, shiftCashierLookup]);

  return (
    <article className="rounded-3xl bg-surface-container-low p-5 sm:p-6 mb-6">
      <h3 className="font-headline text-lg font-bold text-on-surface sm:text-xl flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">groups</span>
        Analisis Performa Staf
      </h3>
      <div className="mt-4 grid gap-3">
        {staffStats.length === 0 && <p className="text-sm text-on-surface-variant">Tidak ada data staf.</p>}
        {staffStats.map((staf, idx) => (
          <div key={staf.name} className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                #{idx + 1}
              </div>
              <div>
                 <div className="font-semibold text-sm">{staf.name}</div>
                 <div className="text-xs text-on-surface-variant">{staf.trxCount} Transaksi Selesai</div>
              </div>
            </div>
            <div className="font-headline font-bold text-primary">
              Rp {staf.omzet.toLocaleString("id-ID")}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
