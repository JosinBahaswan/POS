import type { OwnerAnalyticsData } from "./types";

type OwnerAnalyticsKpiCardsProps = {
  analytics: OwnerAnalyticsData;
};

export function OwnerAnalyticsKpiCards({ analytics }: OwnerAnalyticsKpiCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Omzet Net Hari Ini</p>
        <p className="mt-2 font-headline text-lg font-extrabold text-primary sm:text-xl">Rp {analytics.omzetToday.toLocaleString("id-ID")}</p>
      </article>
      <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Transaksi</p>
        <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface">{analytics.trxToday}</p>
      </article>
      <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Rata-rata Tiket</p>
        <p className="mt-2 font-headline text-lg font-extrabold text-on-surface">Rp {Math.round(analytics.avgTicket).toLocaleString("id-ID")}</p>
      </article>
      <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Margin Hari Ini</p>
        <p className="mt-2 font-headline text-lg font-extrabold text-tertiary">Rp {analytics.marginToday.toLocaleString("id-ID")}</p>
        <p className="text-xs text-on-surface-variant">{analytics.marginPercent.toFixed(1)}%</p>
      </article>
      <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Refund + Void</p>
        <p className="mt-2 font-headline text-2xl font-extrabold text-error">{analytics.refundedToday + analytics.voidedToday}</p>
      </article>
    </section>
  );
}
