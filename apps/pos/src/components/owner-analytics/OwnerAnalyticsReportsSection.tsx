import type { OwnerAnalyticsData, OwnerAnalyticsPeriod } from "./types";

type OwnerAnalyticsReportsSectionProps = {
  period: OwnerAnalyticsPeriod;
  onPeriodChange: (value: OwnerAnalyticsPeriod) => void;
  onExportCsv: () => void;
  analytics: OwnerAnalyticsData;
};

export function OwnerAnalyticsReportsSection({
  period,
  onPeriodChange,
  onExportCsv,
  analytics
}: OwnerAnalyticsReportsSectionProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Laporan Periodik</h3>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(event) => onPeriodChange(event.target.value as OwnerAnalyticsPeriod)}
              className="h-9 rounded-lg border-none bg-surface-container-high px-2 text-xs text-on-surface outline-none"
            >
              <option value="7d">7 Hari</option>
              <option value="30d">30 Hari</option>
              <option value="month">Bulan Ini</option>
            </select>
            <button
              type="button"
              onClick={onExportCsv}
              className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
            Omzet: <span className="font-semibold text-on-surface">Rp {analytics.periodRevenue.toLocaleString("id-ID")}</span>
          </p>
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
            Margin: <span className="font-semibold text-on-surface">Rp {analytics.periodMargin.toLocaleString("id-ID")}</span>
          </p>
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
            Margin %: <span className="font-semibold text-on-surface">{analytics.periodMarginPercent.toFixed(1)}%</span>
          </p>
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
            Transaksi valid: <span className="font-semibold text-on-surface">{analytics.periodCompleted.length}</span>
          </p>
        </div>
      </article>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Perbandingan Cabang/Outlet</h3>
        {analytics.outletSummary.length <= 1 ? (
          <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
            Data outlet saat ini masih satu cabang. Saat multi outlet aktif, perbandingan omzet dan transaksi akan tampil di sini.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {analytics.outletSummary.map((outlet) => (
              <li key={outlet.outletId} className="rounded-xl bg-surface-container-lowest p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-on-surface">Outlet {outlet.outletId}</p>
                  <p className="text-xs text-on-surface-variant">{outlet.trx} trx</p>
                </div>
                <p className="mt-1 font-headline text-lg font-bold text-primary">Rp {outlet.omzet.toLocaleString("id-ID")}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
