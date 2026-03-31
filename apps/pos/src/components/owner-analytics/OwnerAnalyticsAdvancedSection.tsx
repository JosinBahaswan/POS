import type { OwnerAnalyticsData } from "./types";

type OwnerAnalyticsAdvancedSectionProps = {
  analytics: OwnerAnalyticsData;
};

const plannerStatusLabel: Record<OwnerAnalyticsData["executionPlanner"]["status"], string> = {
  off: "Target belum diisi",
  "on-track": "On Track",
  "needs-push": "Perlu Dorongan",
  critical: "Kritis"
};

const plannerStatusClass: Record<OwnerAnalyticsData["executionPlanner"]["status"], string> = {
  off: "bg-surface-container text-on-surface-variant",
  "on-track": "bg-secondary-container text-on-secondary-container",
  "needs-push": "bg-primary-container text-on-primary-container",
  critical: "bg-error-container text-on-error-container"
};

const missionStatusLabel: Record<OwnerAnalyticsData["dailyMission"]["status"], string> = {
  off: "Target belum diisi",
  ahead: "Di Atas Misi",
  "on-track": "Sesuai Jalur",
  behind: "Tertinggal"
};

const missionStatusClass: Record<OwnerAnalyticsData["dailyMission"]["status"], string> = {
  off: "bg-surface-container text-on-surface-variant",
  ahead: "bg-secondary-container text-on-secondary-container",
  "on-track": "bg-primary-container text-on-primary-container",
  behind: "bg-error-container text-on-error-container"
};

const consistencyStateLabel: Record<OwnerAnalyticsData["consistencyRadar"]["state"], string> = {
  stable: "Stabil",
  volatile: "Fluktuatif",
  fragile: "Rapuh"
};

const consistencyStateClass: Record<OwnerAnalyticsData["consistencyRadar"]["state"], string> = {
  stable: "bg-secondary-container text-on-secondary-container",
  volatile: "bg-primary-container text-on-primary-container",
  fragile: "bg-error-container text-on-error-container"
};

const anomalyLevelClass: Record<OwnerAnalyticsData["anomalyRadar"]["notableHours"][number]["level"], string> = {
  alert: "bg-error-container text-on-error-container",
  watch: "bg-surface-container text-on-surface-variant",
  opportunity: "bg-secondary-container text-on-secondary-container"
};

const anomalyLevelLabel: Record<OwnerAnalyticsData["anomalyRadar"]["notableHours"][number]["level"], string> = {
  alert: "Alert",
  watch: "Watch",
  opportunity: "Opportunity"
};

const momentumLabelClass: Record<OwnerAnalyticsData["paymentMomentum"][number]["momentum"], string> = {
  accelerating: "text-secondary",
  stable: "text-on-surface-variant",
  cooling: "text-error"
};

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function OwnerAnalyticsAdvancedSection({ analytics }: OwnerAnalyticsAdvancedSectionProps) {
  return (
    <section className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Daily Mission</h3>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${missionStatusClass[analytics.dailyMission.status]}`}
            >
              {missionStatusLabel[analytics.dailyMission.status]}
            </span>
          </div>

          <p className="mt-3 text-sm text-on-surface-variant">{analytics.dailyMission.focusMessage}</p>

          <div className="mt-3 grid gap-2 text-sm">
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Progress omzet:
              <span className="ml-1 font-semibold text-on-surface">{analytics.dailyMission.revenueProgressPct.toFixed(1)}%</span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Target hari ini:
              <span className="ml-1 font-semibold text-on-surface">{formatCurrency(analytics.dailyMission.requiredRevenue)}</span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Realisasi hari ini:
              <span className="ml-1 font-semibold text-on-surface">{formatCurrency(analytics.dailyMission.achievedRevenue)}</span>
            </p>
          </div>

          <ul className="mt-3 grid gap-2 text-xs text-on-surface-variant">
            {analytics.dailyMission.nextActions.map((action) => (
              <li key={action} className="rounded-lg bg-surface-container-lowest px-3 py-2">
                {action}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Execution Planner</h3>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${plannerStatusClass[analytics.executionPlanner.status]}`}
            >
              {plannerStatusLabel[analytics.executionPlanner.status]}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Baseline/hari:
              <span className="ml-1 font-semibold text-on-surface">{formatCurrency(analytics.executionPlanner.baselineDailyRevenue)}</span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Butuh/hari:
              <span className="ml-1 font-semibold text-on-surface">{formatCurrency(analytics.executionPlanner.requiredDailyRevenue)}</span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Lift transaksi:
              <span className="ml-1 font-semibold text-on-surface">
                {formatSignedPercent(analytics.executionPlanner.transactionsLiftPct)}
              </span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Lift avg ticket:
              <span className="ml-1 font-semibold text-on-surface">
                {formatSignedPercent(analytics.executionPlanner.averageTicketLiftPct)}
              </span>
            </p>
          </div>

          <p className="mt-3 text-xs text-on-surface-variant">{analytics.executionPlanner.primaryAction}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{analytics.executionPlanner.secondaryAction}</p>

          <div className="mt-3 grid gap-2 text-xs text-on-surface-variant">
            <p className="rounded-lg bg-surface-container-lowest px-3 py-2">
              Fokus metode bayar: {analytics.executionPlanner.recommendedFocusPayments.join(", ") || "-"}
            </p>
            <p className="rounded-lg bg-surface-container-lowest px-3 py-2">
              Jam puncak: {analytics.executionPlanner.recommendedPeakHours.join(", ") || "-"}
            </p>
            <p className="rounded-lg bg-surface-container-lowest px-3 py-2">
              Jam lemah: {analytics.executionPlanner.recommendedSlowHours.join(", ") || "-"}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Anomaly Radar</h3>
            <span className="text-xs text-on-surface-variant">Baseline {analytics.anomalyRadar.baselineDays} hari</span>
          </div>

          <p className="mt-3 text-sm text-on-surface-variant">{analytics.anomalyRadar.summary}</p>
          <p className="mt-2 text-xs text-on-surface-variant">
            Stabilitas jam: <span className="font-semibold text-on-surface">{analytics.anomalyRadar.stableHoursPct.toFixed(1)}%</span>
          </p>

          {analytics.anomalyRadar.notableHours.length === 0 ? (
            <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Belum ada anomali signifikan hari ini.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {analytics.anomalyRadar.notableHours.map((hour) => (
                <li key={hour.hour} className="rounded-xl bg-surface-container-lowest p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-on-surface">{hour.label}</p>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${anomalyLevelClass[hour.level]}`}>
                      {anomalyLevelLabel[hour.level]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Deviasi {formatSignedPercent(hour.deviationPct)} • Hari ini {formatCurrency(hour.todayRevenue)} • Baseline {formatCurrency(hour.baselineRevenue)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Consistency Radar</h3>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${consistencyStateClass[analytics.consistencyRadar.state]}`}
            >
              {consistencyStateLabel[analytics.consistencyRadar.state]}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Skor:
              <span className="ml-1 font-semibold text-on-surface">{analytics.consistencyRadar.score}</span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Volatilitas:
              <span className="ml-1 font-semibold text-on-surface">{analytics.consistencyRadar.volatilityPct.toFixed(1)}%</span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Active days:
              <span className="ml-1 font-semibold text-on-surface">{analytics.consistencyRadar.activeDays}</span>
            </p>
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-on-surface-variant">
              Zero-sales days:
              <span className="ml-1 font-semibold text-on-surface">{analytics.consistencyRadar.zeroSalesDays}</span>
            </p>
          </div>

          <p className="mt-3 text-xs text-on-surface-variant">{analytics.consistencyRadar.recommendation}</p>

          <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            Momentum Metode Bayar
          </h4>
          <ul className="mt-2 grid gap-2">
            {analytics.paymentMomentum.map((item) => (
              <li key={item.key} className="rounded-lg bg-surface-container-lowest px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">{item.label}</span>
                  <span className={momentumLabelClass[item.momentum]}>{formatSignedPercent(item.revenueDeltaPct)}</span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Share {item.shareRevenueCurrentPct.toFixed(1)}% • Rev {formatCurrency(item.revenueCurrent)}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Target Scenario Simulator</h3>
        <div className="mt-3 grid gap-2">
          {analytics.targetScenarioSimulator.scenarios.map((scenario) => (
            <div key={scenario.level} className="rounded-xl bg-surface-container-lowest p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-on-surface">{scenario.label}</p>
                <p className="text-xs text-on-surface-variant">Win prob: {scenario.winProbabilityPct}%</p>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">
                Proyeksi akhir bulan {formatCurrency(scenario.projectedMonthEndRevenue)} ({scenario.projectedProgressPct.toFixed(1)}% target)
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">{scenario.action}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
