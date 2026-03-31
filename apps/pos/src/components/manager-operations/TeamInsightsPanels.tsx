import type { DashboardSnapshot } from "./types";

type TeamInsightsPanelsProps = {
  dashboard: DashboardSnapshot;
};

export function TeamInsightsPanels({ dashboard }: TeamInsightsPanelsProps) {
  return (
    <>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Top Performa Tim (7 Hari)</h3>
          {dashboard.topTeam.length === 0 ? (
            <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Belum ada data performa tim.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {dashboard.topTeam.map((member, index) => (
                <li key={member.cashierName} className="rounded-xl bg-surface-container-lowest p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">#{index + 1} {member.cashierName}</p>
                      <p className="text-xs text-on-surface-variant">
                        Trx selesai: {member.completedCount} • Issue: {member.issueCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-headline text-base font-extrabold text-primary">Rp {Math.round(member.revenue).toLocaleString("id-ID")}</p>
                      <p className="text-[11px] text-on-surface-variant">Avg Ticket Rp {Math.round(member.avgTicket).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Perlu Pendampingan</h3>
          {dashboard.coachingCandidates.length === 0 ? (
            <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Tidak ada kasir yang melewati ambang issue rate minggu ini.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {dashboard.coachingCandidates.map((member) => (
                <li key={member.cashierName} className="rounded-xl bg-surface-container-lowest p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{member.cashierName}</p>
                      <p className="text-xs text-on-surface-variant">
                        Issue rate {(member.issueRate * 100).toFixed(1)}% • Trx total {member.totalCount}
                      </p>
                    </div>
                    <span className="rounded-full bg-error-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-error-container">
                      Coaching
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Rekomendasi Aksi Manajer (24 Jam)</h3>
          <p className="text-xs font-semibold text-on-surface-variant">Trx 7 hari: {dashboard.completed7dCount}</p>
        </div>
        <ul className="mt-3 grid gap-2">
          {dashboard.recommendedActions.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              {index + 1}. {item}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
