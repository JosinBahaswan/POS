import type { OwnerAnalyticsData } from "./types";

type OwnerAnalyticsInsightsSectionProps = {
  analytics: OwnerAnalyticsData;
};

export function OwnerAnalyticsInsightsSection({ analytics }: OwnerAnalyticsInsightsSectionProps) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Distribusi Metode Bayar</h3>
          <ul className="mt-3 grid gap-3">
            {analytics.paymentSummary.map((payment) => (
              <li key={payment.key} className="rounded-xl bg-surface-container-lowest p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">{payment.label}</span>
                  <span className="font-medium text-on-surface-variant">{payment.count} trx</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div className={`h-full rounded-full ${payment.barClass}`} style={{ width: `${payment.percent}%` }} />
                </div>
                <p className="mt-2 text-xs font-semibold text-on-surface">Rp {payment.total.toLocaleString("id-ID")}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Jam Paling Ramai</h3>
          <ul className="mt-3 grid gap-3">
            {analytics.timeSlotSummary.map((slot) => (
              <li key={slot.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">{slot.label}</span>
                  <span className="text-on-surface-variant">{slot.count} trx</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${slot.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Tren Omzet 7 Hari</h3>
        <ul className="mt-3 grid gap-2">
          {analytics.trend.map((day) => (
            <li key={day.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">{day.label}</span>
                <span className="text-on-surface-variant">Rp {day.revenue.toLocaleString("id-ID")}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((day.revenue / analytics.maxTrendRevenue) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Produk Terlaris Hari Ini</h3>
          <span className="text-xs font-medium text-on-surface-variant">Top 5</span>
        </div>

        {analytics.topProducts.length === 0 ? (
          <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
            Belum ada transaksi hari ini.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {analytics.topProducts.map((product, index) => (
              <li key={product.name} className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-on-surface">{product.name}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{product.qty} terjual</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
