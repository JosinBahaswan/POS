import type { UserRole } from "../../types";
import type { DashboardSnapshot } from "./types";

type ManagerOverviewPanelsProps = {
  role: UserRole;
  dashboard: DashboardSnapshot;
};

export function ManagerOverviewPanels({ role, dashboard }: ManagerOverviewPanelsProps) {
  return (
    <>
      <section className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
          {role === "owner" ? "Owner Oversight" : "Manager Control"}
        </p>
        <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl">Operasional Harian</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Approval refund/void/diskon besar/risiko margin, performa kasir per shift, dan ringkasan laporan harian.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Omzet Hari Ini</p>
          <p className="mt-2 font-headline text-lg font-extrabold text-primary sm:text-xl">Rp {dashboard.omzetToday.toLocaleString("id-ID")}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Transaksi Valid</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface">{dashboard.completedCount}</p>
        </article>
        <article className="rounded-2xl border border-error/10 bg-error-container/40 p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-error">Refund + Void</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-error">{dashboard.refundedCount + dashboard.voidedCount}</p>
        </article>
        <article className="rounded-2xl border border-tertiary/10 bg-tertiary-fixed/40 p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-tertiary-fixed-variant">Approval Pending</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-tertiary-fixed-variant">{dashboard.pendingApprovals.length}</p>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Avg Ticket Hari Ini</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">Rp {Math.round(dashboard.avgTicketToday).toLocaleString("id-ID")}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Rasio Diskon</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">{(dashboard.discountRateToday * 100).toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Issue Rate Hari Ini</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">{(dashboard.issueRateToday * 100).toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl border border-warning/20 bg-tertiary-fixed/35 p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-tertiary-fixed-variant">Pending 15+ Menit</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-tertiary-fixed-variant">{dashboard.pendingOver15m}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">SLA Approval (7H)</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">
            {dashboard.avgApprovalResponseMinutes === null
              ? "-"
              : `${Math.round(dashboard.avgApprovalResponseMinutes).toLocaleString("id-ID")} mnt`}
          </p>
        </article>
      </section>
    </>
  );
}
