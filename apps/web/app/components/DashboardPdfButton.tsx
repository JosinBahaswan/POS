"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardSummary } from "@/lib/dashboard";

type DashboardPdfButtonProps = {
  summary: DashboardSummary | null;
  tenantId?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return "Belum ada transaksi";
  return new Date(value).toLocaleString("id-ID");
};

const formatPercent = (value: number) => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const normalizeSubscription = (status: string) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export function DashboardPdfButton({ summary, tenantId }: DashboardPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = () => {
    if (!summary || !tenantId || isExporting) return;

    setIsExporting(true);

    try {
      const generatedAt = new Date();
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const activeTeam = summary.activeCashiers + summary.activeManagers;
      const weekTotalRevenue = summary.weekRevenue.reduce((sum, point) => sum + point.revenue, 0);
      const strongestDay = summary.weekRevenue.reduce(
        (best, point) => (point.revenue > best.revenue ? point : best),
        summary.weekRevenue[0]
      );
      const dominantSource = summary.sourceMix[0];
      const topProduct = summary.topProducts[0];
      const filteredSnapshot = summary.filteredSnapshot;
      const filteredBreakdownPreview = summary.filteredDailyBreakdown
        .slice(0, 10)
        .map((point) => `${point.label}: ${formatCurrency(point.revenue)} (${point.transactions} trx)`)
        .join(" | ");
      const dayTypeMixSummary = summary.dayTypeMix
        .map((point) => `${point.label}: ${point.shareRevenuePct.toFixed(1)}% omzet (${point.transactions} trx)`)
        .join(" | ");
      const periodComparisonLabel = `${formatPercent(summary.trendRevenueDeltaPct)} vs ${summary.trendPeriodDays} hari sebelumnya`;
      const periodBenchmarkSummary = summary.periodBenchmarks
        .map((benchmark) => `${benchmark.periodDays}h ${formatCurrency(benchmark.revenueTotal)} (${formatPercent(benchmark.revenueDeltaPct)})`)
        .join(" | ");
      const productMomentumSummary = summary.productMomentum
        .slice(0, 3)
        .map((item) => `${item.name} ${formatPercent(item.revenueDeltaPct)} (${item.trend})`)
        .join(" | ");
      const sourceMomentumSummary = summary.sourceMomentum
        .slice(0, 3)
        .map((item) => `${item.label} ${formatPercent(item.revenueDeltaPct)} (${item.momentum})`)
        .join(" | ");
      const anomalyRadarSummary = summary.anomalyRadar.notableHours
        .slice(0, 3)
        .map((item) => `${item.label} ${formatPercent(item.deviationPct)} (${item.level})`)
        .join(" | ");
      const sourcePlaybookSummary = summary.sourcePlaybook.items
        .slice(0, 3)
        .map((item) => `${item.label} ${item.priority} (${item.revenueSharePct.toFixed(1)}%)`)
        .join(" | ");
      const dailyMissionActionsSummary = summary.dailyMission.nextActions.join(" | ") || "Belum ada aksi";
      const targetScenarioSummary = summary.targetScenarioSimulator.scenarios
        .map((scenario) => `${scenario.label}: ${formatCurrency(scenario.projectedMonthEndRevenue)} (${scenario.winProbabilityPct.toFixed(1)}%)`)
        .join(" | ");
      const bestWinScenario = summary.targetScenarioSimulator.scenarios
        .slice()
        .sort((a, b) => b.winProbabilityPct - a.winProbabilityPct)[0];
      const bestProjectedScenario = summary.targetScenarioSimulator.scenarios
        .slice()
        .sort((a, b) => b.projectedMonthEndRevenue - a.projectedMonthEndRevenue)[0];
      const executionPlannerFocusSources = summary.executionPlanner.recommendedFocusSources.join(" | ") || "Belum ada data";
      const executionPlannerPeakHours = summary.executionPlanner.recommendedPeakHours.join(" | ") || "Belum ada data";
      const executionPlannerSlowHours = summary.executionPlanner.recommendedSlowHours.join(" | ") || "Belum ada data";

      doc.setFillColor(15, 76, 92);
      doc.rect(0, 0, pageWidth, 128, "F");
      doc.setFillColor(20, 111, 138);
      doc.rect(0, 96, pageWidth, 32, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Laporan Dashboard POS", 40, 54);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Tenant: ${tenantId}`, 40, 76);
      doc.text(`Dibuat: ${generatedAt.toLocaleString("id-ID")}`, 40, 94);

      const cardY = 154;
      const cardGap = 16;
      const cardWidth = (pageWidth - 80 - cardGap) / 2;
      const cardHeight = 86;

      const drawCard = (
        x: number,
        y: number,
        title: string,
        value: string,
        accent: [number, number, number]
      ) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, cardHeight, 10, 10, "F");
        doc.setFillColor(accent[0], accent[1], accent[2]);
        doc.roundedRect(x, y, 6, cardHeight, 6, 6, "F");

        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(title, x + 16, y + 24);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text(value, x + 16, y + 54, { maxWidth: cardWidth - 24 });
      };

      drawCard(40, cardY, "Omzet Hari Ini", formatCurrency(summary.todayRevenue), [20, 184, 166]);
      drawCard(40 + cardWidth + cardGap, cardY, "Jumlah Transaksi", String(summary.todayTransactions), [59, 130, 246]);
      drawCard(40, cardY + cardHeight + cardGap, "Average Ticket", formatCurrency(summary.averageTicketToday), [14, 165, 233]);
      drawCard(40 + cardWidth + cardGap, cardY + cardHeight + cardGap, "Tim Aktif", String(activeTeam), [245, 158, 11]);

      autoTable(doc, {
        startY: cardY + cardHeight * 2 + cardGap + 28,
        margin: { left: 40, right: 40 },
        head: [["Ringkasan", "Nilai"]],
        body: [
          ["ID Tenant", summary.tenantId],
          ["Omzet Hari Ini", formatCurrency(summary.todayRevenue)],
          ["Omzet Kemarin", formatCurrency(summary.yesterdayRevenue)],
          ["Perubahan Omzet", formatPercent(summary.revenueDeltaPct)],
          ["Jumlah Transaksi Hari Ini", String(summary.todayTransactions)],
          ["Jumlah Transaksi Kemarin", String(summary.yesterdayTransactions)],
          ["Perubahan Transaksi", formatPercent(summary.transactionsDeltaPct)],
          ["Average Ticket Hari Ini", formatCurrency(summary.averageTicketToday)],
          ["Average Ticket Kemarin", formatCurrency(summary.averageTicketYesterday)],
          ["Perubahan Average Ticket", formatPercent(summary.averageTicketDeltaPct)],
          ["Pending Sinkronisasi (POS source)", String(summary.pendingSync)],
          ["Status Subscription", normalizeSubscription(summary.subscriptionStatus)],
          ["Cashier Aktif", String(summary.activeCashiers)],
          ["Manager Aktif", String(summary.activeManagers)],
          ["Produk Aktif", String(summary.activeProducts)],
          ["Window Analisis", `${summary.trendPeriodDays} hari`],
          ["Omzet Window Saat Ini", formatCurrency(summary.trendRevenueTotal)],
          ["Omzet Window Sebelumnya", formatCurrency(summary.trendRevenuePrevious)],
          ["Delta Omzet Window", periodComparisonLabel],
          ["Ringkasan Benchmark 7/14/30", periodBenchmarkSummary || "Belum ada data"],
          ...summary.periodBenchmarks.map((benchmark) => [
            `Benchmark ${benchmark.periodDays} Hari`,
            `${formatCurrency(benchmark.revenueTotal)} (${formatPercent(benchmark.revenueDeltaPct)}) · ${benchmark.transactionsTotal} trx · aktif ${benchmark.activeDays}/${benchmark.periodDays}`
          ]),
          ["Transaksi Window Saat Ini", String(summary.trendTransactionsTotal)],
          ["Transaksi Window Sebelumnya", String(summary.trendTransactionsPrevious)],
          ["Delta Transaksi Window", formatPercent(summary.trendTransactionsDeltaPct)],
          ["Proyeksi Omzet 30 Hari", formatCurrency(summary.projectedMonthlyRevenue)],
          ["Ringkasan Product Momentum", productMomentumSummary || "Belum ada data"],
          ...summary.productMomentum.slice(0, 5).map((item) => [
            `Momentum ${item.name}`,
            `${formatCurrency(item.revenueCurrent)} (${formatPercent(item.revenueDeltaPct)}) · qty ${item.qtyCurrent} vs ${item.qtyPrevious} · share ${item.shareRevenueCurrentPct.toFixed(1)}%`
          ]),
          ["Ringkasan Source Momentum", sourceMomentumSummary || "Belum ada data"],
          ...summary.sourceMomentum.slice(0, 5).map((item) => [
            `Source ${item.label}`,
            `${formatCurrency(item.revenueCurrent)} (${formatPercent(item.revenueDeltaPct)}) · trx ${item.transactionsCurrent} vs ${item.transactionsPrevious} · share ${item.shareRevenueCurrentPct.toFixed(1)}%`
          ]),
          ["Ringkasan Anomaly Radar", summary.anomalyRadar.summary],
          [
            "Baseline Jam Operasional",
            `${summary.anomalyRadar.baselineDays} hari · stabil ${summary.anomalyRadar.stableHoursPct.toFixed(1)}% · alert ${summary.anomalyRadar.alertHours} · opportunity ${summary.anomalyRadar.opportunityHours}`
          ],
          ["Detail Anomali Jam", anomalyRadarSummary || "Belum ada anomali signifikan"],
          ...summary.anomalyRadar.notableHours.slice(0, 4).map((item) => [
            `Jam ${item.label}`,
            `${formatCurrency(item.todayRevenue)} vs baseline ${formatCurrency(item.baselineRevenue)} (${formatPercent(item.deviationPct)}) · ${item.action}`
          ]),
          ["Ringkasan Source Playbook", sourcePlaybookSummary || "Belum ada playbook"],
          ["Source Playbook Focus", summary.sourcePlaybook.primaryFocus],
          ...summary.sourcePlaybook.items.slice(0, 4).map((item) => [
            `Playbook ${item.label}`,
            `${item.priority.toUpperCase()} · share ${item.revenueSharePct.toFixed(1)}% · delta ${formatPercent(item.revenueDeltaPct)} · confidence ${item.confidenceScore}`
          ]),
          ["Filter Source Aktif", summary.activeFilters.source],
          ["Filter Day Type Aktif", summary.activeFilters.dayType],
          ["Filtered Lens", filteredSnapshot.label],
          ["Omzet Filter Saat Ini", formatCurrency(filteredSnapshot.revenueTotal)],
          ["Omzet Filter Sebelumnya", formatCurrency(filteredSnapshot.revenuePrevious)],
          ["Delta Omzet Filter", formatPercent(filteredSnapshot.revenueDeltaPct)],
          ["Transaksi Filter Saat Ini", String(filteredSnapshot.transactionsTotal)],
          ["Transaksi Filter Sebelumnya", String(filteredSnapshot.transactionsPrevious)],
          ["Delta Transaksi Filter", formatPercent(filteredSnapshot.transactionsDeltaPct)],
          ["Avg Ticket Filter", formatCurrency(filteredSnapshot.averageTicket)],
          ["Peak Hour Filter", filteredSnapshot.peakHourLabel],
          ["Proyeksi Filter 30 Hari", formatCurrency(filteredSnapshot.projectedMonthlyRevenue)],
          ["Hari Terkuat Filter", filteredSnapshot.bestDayLabel],
          ["Hari Terlemah Filter", filteredSnapshot.worstDayLabel],
          ["Preview Breakdown Filter", filteredBreakdownPreview || "Belum ada data"],
          ["Target Bulanan", formatCurrency(summary.monthlyTargetTracker.monthlyTarget)],
          ["Omzet MTD", formatCurrency(summary.monthlyTargetTracker.monthToDateRevenue)],
          ["Transaksi MTD", String(summary.monthlyTargetTracker.monthToDateTransactions)],
          ["Progress Target", `${summary.monthlyTargetTracker.targetProgressPct.toFixed(1)}%`],
          ["Progress Waktu", `${summary.monthlyTargetTracker.timeProgressPct.toFixed(1)}%`],
          ["Proyeksi Akhir Bulan", formatCurrency(summary.monthlyTargetTracker.projectedMonthEndRevenue)],
          ["Hari Tersisa", String(summary.monthlyTargetTracker.remainingDaysInMonth)],
          ["Kebutuhan Harian", formatCurrency(summary.monthlyTargetTracker.requiredDailyRevenueForTarget)],
          ["Gap Target", formatCurrency(summary.monthlyTargetTracker.targetGap)],
          ["Status Target", summary.monthlyTargetTracker.status],
          ["Execution Planner Status", summary.executionPlanner.status],
          ["Planner Baseline Omzet Harian", formatCurrency(summary.executionPlanner.baselineDailyRevenue)],
          ["Planner Kebutuhan Omzet Harian", formatCurrency(summary.executionPlanner.requiredDailyRevenue)],
          ["Planner Gap Omzet Harian", formatCurrency(summary.executionPlanner.dailyRevenueGap)],
          ["Planner Baseline Trx/Hari", summary.executionPlanner.baselineTransactionsPerDay.toFixed(1)],
          ["Planner Kebutuhan Trx/Hari", summary.executionPlanner.requiredTransactionsPerDay.toFixed(1)],
          ["Planner Lift Transaksi", formatPercent(summary.executionPlanner.transactionsLiftPct)],
          ["Planner Baseline Average Ticket", formatCurrency(summary.executionPlanner.baselineAverageTicket)],
          ["Planner Kebutuhan Average Ticket", formatCurrency(summary.executionPlanner.requiredAverageTicket)],
          ["Planner Lift Average Ticket", formatPercent(summary.executionPlanner.averageTicketLiftPct)],
          ["Planner Focus Channel", executionPlannerFocusSources],
          ["Planner Prime Hours", executionPlannerPeakHours],
          ["Planner Recovery Hours", executionPlannerSlowHours],
          ["Planner Action Utama", summary.executionPlanner.primaryAction],
          ["Planner Action Tambahan", summary.executionPlanner.secondaryAction],
          ["Daily Mission Status", summary.dailyMission.status],
          ["Daily Mission Label", summary.dailyMission.label],
          ["Daily Mission Required Revenue", formatCurrency(summary.dailyMission.requiredRevenue)],
          ["Daily Mission Achieved Revenue", formatCurrency(summary.dailyMission.achievedRevenue)],
          ["Daily Mission Revenue Progress", `${summary.dailyMission.revenueProgressPct.toFixed(1)}%`],
          ["Daily Mission Revenue Gap", formatCurrency(summary.dailyMission.revenueGap)],
          ["Daily Mission Required Transactions", summary.dailyMission.requiredTransactions.toFixed(1)],
          ["Daily Mission Achieved Transactions", String(summary.dailyMission.achievedTransactions)],
          ["Daily Mission Transactions Progress", `${summary.dailyMission.transactionsProgressPct.toFixed(1)}%`],
          ["Daily Mission Required Average Ticket", formatCurrency(summary.dailyMission.requiredAverageTicket)],
          ["Daily Mission Achieved Average Ticket", formatCurrency(summary.dailyMission.achievedAverageTicket)],
          ["Daily Mission Average Ticket Progress", `${summary.dailyMission.averageTicketProgressPct.toFixed(1)}%`],
          ["Daily Mission Focus", summary.dailyMission.focusMessage],
          ["Daily Mission Next Actions", dailyMissionActionsSummary],
          ["Consistency State", summary.consistencyRadar.state],
          ["Consistency Score", `${summary.consistencyRadar.score}/100`],
          ["Consistency Volatility", `${summary.consistencyRadar.volatilityPct.toFixed(1)}%`],
          ["Consistency Active Days", `${summary.consistencyRadar.activeDays}/${summary.trendPeriodDays} (${summary.consistencyRadar.activeDaysPct.toFixed(1)}%)`],
          ["Consistency Zero Sales Days", String(summary.consistencyRadar.zeroSalesDays)],
          ["Consistency Best Streak", `${summary.consistencyRadar.bestStreakDays} hari`],
          ["Consistency Weak Streak", `${summary.consistencyRadar.weakStreakDays} hari`],
          ["Consistency Recommendation", summary.consistencyRadar.recommendation],
          ["Scenario Volatility", `${summary.targetScenarioSimulator.volatilityPct.toFixed(1)}%`],
          ["Scenario Baseline Omzet Harian", formatCurrency(summary.targetScenarioSimulator.baselineDailyRevenue)],
          ["Scenario Baseline Trx/Hari", summary.targetScenarioSimulator.baselineTransactionsPerDay.toFixed(1)],
          ["Scenario Baseline Average Ticket", formatCurrency(summary.targetScenarioSimulator.baselineAverageTicket)],
          [
            "Scenario Best Win",
            bestWinScenario
              ? `${bestWinScenario.label} (${bestWinScenario.winProbabilityPct.toFixed(1)}%)`
              : "Belum ada data"
          ],
          [
            "Scenario Best Projection",
            bestProjectedScenario
              ? `${bestProjectedScenario.label} (${formatCurrency(bestProjectedScenario.projectedMonthEndRevenue)})`
              : "Belum ada data"
          ],
          ["Scenario Ringkas", targetScenarioSummary || "Belum ada data"],
          ...summary.targetScenarioSimulator.scenarios.map((scenario) => [
            `Scenario ${scenario.label}`,
            `${formatCurrency(scenario.projectedMonthEndRevenue)} · gap ${formatCurrency(scenario.targetGap)} · progress ${scenario.projectedProgressPct.toFixed(1)}% · need/hari ${formatCurrency(scenario.requiredDailyRevenue)} · need trx ${scenario.requiredTransactionsPerDay.toFixed(1)} · win ${scenario.winProbabilityPct.toFixed(1)}%`
          ]),
          ["Avg Omzet Harian Window", formatCurrency(summary.trendAverageDailyRevenue)],
          ["Peak Day Window", summary.trendPeakDayLabel],
          ["Mix Hari Kerja vs Weekend", dayTypeMixSummary || "Belum ada data"],
          ["Jam Tersibuk", summary.bestHourLabel],
          [
            "Sumber Dominan",
            dominantSource
              ? `${dominantSource.source} (${dominantSource.shareTransactionsPct.toFixed(1)}% transaksi)`
              : "Belum ada transaksi"
          ],
          [
            "Top Product",
            topProduct ? `${topProduct.name} (${topProduct.qty} unit)` : "Belum ada line item"
          ],
          ["Business Health Score", `${summary.healthScore}/100 (${summary.healthLabel})`],
          ["Health Focus", summary.healthFocus.join(" | ")],
          [`Omzet ${summary.trendPeriodDays} Hari`, formatCurrency(weekTotalRevenue)],
          ["Hari Terkuat", `${strongestDay?.label ?? "-"} (${formatCurrency(strongestDay?.revenue ?? 0)})`],
          [
            "Catatan Insight",
            summary.insights.map((insight) => `${insight.level.toUpperCase()}: ${insight.title}`).join(" | ")
          ],
          ["Catatan Alert", summary.alerts.map((alert) => `${alert.level.toUpperCase()}: ${alert.title}`).join(" | ")],
          ["Transaksi Terakhir", formatDateTime(summary.lastTransactionAt)]
        ],
        styles: {
          fontSize: 10,
          textColor: [30, 41, 59],
          cellPadding: 8,
          lineColor: [226, 232, 240],
          lineWidth: 0.6
        },
        headStyles: {
          fillColor: [15, 76, 92],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
            fillColor: [241, 245, 249]
          }
        },
        alternateRowStyles: {
          fillColor: [250, 252, 255]
        }
      });

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
        doc.text("Dokumen ini dibuat otomatis oleh POS SaaS Flight Deck.", 40, 805);

      doc.save(`laporan-dashboard-${tenantId}-${generatedAt.toISOString().slice(0, 10)}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownloadPdf}
      disabled={!summary || !tenantId || isExporting}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isExporting ? "Mempersiapkan PDF..." : "Download Laporan PDF"}
    </button>
  );
}
