import type { ShiftPerformanceRow } from "./types";

type ShiftPerformancePanelProps = {
  shiftPerformance: ShiftPerformanceRow[];
};

export function ShiftPerformancePanel({ shiftPerformance }: ShiftPerformancePanelProps) {
  return (
    <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Performa Kasir per Shift</h3>

      {shiftPerformance.length === 0 ? (
        <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
          Belum ada data shift.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {shiftPerformance.map((row) => (
            <li key={row.shiftId} className="rounded-xl bg-surface-container-lowest p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{row.cashierName}</p>
                  <p className="text-xs text-on-surface-variant">{row.shiftId}</p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(row.openedAt).toLocaleString("id-ID")}
                    {row.closedAt ? ` - ${new Date(row.closedAt).toLocaleString("id-ID")}` : " - aktif"}
                  </p>
                </div>
                <p className="font-headline text-lg font-extrabold text-primary">Rp {row.omzet.toLocaleString("id-ID")}</p>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                  Trx: <span className="font-semibold text-on-surface">{row.trxCount}</span>
                </p>
                <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                  Refund: <span className="font-semibold text-on-surface">{row.refundedCount}</span>
                </p>
                <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                  Void: <span className="font-semibold text-on-surface">{row.voidedCount}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
