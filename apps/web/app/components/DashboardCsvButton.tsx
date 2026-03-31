"use client";

import { useState } from "react";
import type { DashboardSummary } from "@/lib/dashboard";

type DashboardCsvButtonProps = {
  summary: DashboardSummary | null;
  tenantId?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);

const escapeCsv = (value: string | number) => {
  const normalized = String(value).replace(/"/g, '""');
  return `"${normalized}"`;
};

export function DashboardCsvButton({ summary, tenantId }: DashboardCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadCsv = () => {
    if (!summary || !tenantId || isExporting) return;

    setIsExporting(true);

    try {
      const bestWinScenario = summary.targetScenarioSimulator.scenarios
        .slice()
        .sort((a, b) => b.winProbabilityPct - a.winProbabilityPct)[0];
      const bestProjectedScenario = summary.targetScenarioSimulator.scenarios
        .slice()
        .sort((a, b) => b.projectedMonthEndRevenue - a.projectedMonthEndRevenue)[0];

      const rows: Array<Array<string | number>> = [
        ["Metric", "Value"],
        ["Tenant ID", summary.tenantId],
        ["Generated At", new Date(summary.generatedAt).toLocaleString("id-ID")],
        ["Revenue Today", formatCurrency(summary.todayRevenue)],
        ["Revenue Yesterday", formatCurrency(summary.yesterdayRevenue)],
        ["Revenue Delta (%)", summary.revenueDeltaPct.toFixed(2)],
        ["Transactions Today", summary.todayTransactions],
        ["Transactions Yesterday", summary.yesterdayTransactions],
        ["Transactions Delta (%)", summary.transactionsDeltaPct.toFixed(2)],
        ["Average Ticket Today", formatCurrency(summary.averageTicketToday)],
        ["Average Ticket Yesterday", formatCurrency(summary.averageTicketYesterday)],
        ["Average Ticket Delta (%)", summary.averageTicketDeltaPct.toFixed(2)],
        ["Pending Sync", summary.pendingSync],
        ["Subscription Status", summary.subscriptionStatus],
        ["Active Cashiers", summary.activeCashiers],
        ["Active Managers", summary.activeManagers],
        ["Active Products", summary.activeProducts],
        ["Last Transaction At", summary.lastTransactionAt ? new Date(summary.lastTransactionAt).toLocaleString("id-ID") : "Belum ada"],
        ["Trend Window (Days)", summary.trendPeriodDays],
        ["Trend Revenue Total", formatCurrency(summary.trendRevenueTotal)],
        ["Trend Revenue Previous", formatCurrency(summary.trendRevenuePrevious)],
        ["Trend Revenue Delta (%)", summary.trendRevenueDeltaPct.toFixed(2)],
        ["Trend Transactions Total", summary.trendTransactionsTotal],
        ["Trend Transactions Previous", summary.trendTransactionsPrevious],
        ["Trend Transactions Delta (%)", summary.trendTransactionsDeltaPct.toFixed(2)],
        ["Trend Average Daily Revenue", formatCurrency(summary.trendAverageDailyRevenue)],
        ["Trend Projected Monthly Revenue", formatCurrency(summary.projectedMonthlyRevenue)],
        ["Trend Peak Day", summary.trendPeakDayLabel],
        ["Active Source Filter", summary.activeFilters.source],
        ["Active Day Type Filter", summary.activeFilters.dayType],
        ["Filtered Snapshot Label", summary.filteredSnapshot.label],
        ["Filtered Revenue Total", formatCurrency(summary.filteredSnapshot.revenueTotal)],
        ["Filtered Revenue Previous", formatCurrency(summary.filteredSnapshot.revenuePrevious)],
        ["Filtered Revenue Delta (%)", summary.filteredSnapshot.revenueDeltaPct.toFixed(2)],
        ["Filtered Transactions Total", summary.filteredSnapshot.transactionsTotal],
        ["Filtered Transactions Previous", summary.filteredSnapshot.transactionsPrevious],
        ["Filtered Transactions Delta (%)", summary.filteredSnapshot.transactionsDeltaPct.toFixed(2)],
        ["Filtered Average Ticket", formatCurrency(summary.filteredSnapshot.averageTicket)],
        ["Filtered Peak Hour", summary.filteredSnapshot.peakHourLabel],
        ["Filtered Projected Monthly Revenue", formatCurrency(summary.filteredSnapshot.projectedMonthlyRevenue)],
        ["Filtered Best Day", summary.filteredSnapshot.bestDayLabel],
        ["Filtered Worst Day", summary.filteredSnapshot.worstDayLabel],
        ["Monthly Target", formatCurrency(summary.monthlyTargetTracker.monthlyTarget)],
        ["Month To Date Revenue", formatCurrency(summary.monthlyTargetTracker.monthToDateRevenue)],
        ["Month To Date Transactions", summary.monthlyTargetTracker.monthToDateTransactions],
        ["Target Progress (%)", summary.monthlyTargetTracker.targetProgressPct.toFixed(1)],
        ["Time Progress (%)", summary.monthlyTargetTracker.timeProgressPct.toFixed(1)],
        ["Projected Month End Revenue", formatCurrency(summary.monthlyTargetTracker.projectedMonthEndRevenue)],
        ["Remaining Days In Month", summary.monthlyTargetTracker.remainingDaysInMonth],
        ["Required Daily Revenue For Target", formatCurrency(summary.monthlyTargetTracker.requiredDailyRevenueForTarget)],
        ["Target Gap", formatCurrency(summary.monthlyTargetTracker.targetGap)],
        ["Target Status", summary.monthlyTargetTracker.status],
        ["Business Health Score", summary.healthScore],
        ["Business Health Label", summary.healthLabel],
        ["Execution Planner Status", summary.executionPlanner.status],
        ["Execution Planner Baseline Daily Revenue", formatCurrency(summary.executionPlanner.baselineDailyRevenue)],
        ["Execution Planner Required Daily Revenue", formatCurrency(summary.executionPlanner.requiredDailyRevenue)],
        ["Execution Planner Daily Revenue Gap", formatCurrency(summary.executionPlanner.dailyRevenueGap)],
        ["Execution Planner Baseline Transactions/Day", summary.executionPlanner.baselineTransactionsPerDay.toFixed(1)],
        ["Execution Planner Required Transactions/Day", summary.executionPlanner.requiredTransactionsPerDay.toFixed(1)],
        ["Execution Planner Transactions Lift (%)", summary.executionPlanner.transactionsLiftPct.toFixed(1)],
        ["Execution Planner Baseline Average Ticket", formatCurrency(summary.executionPlanner.baselineAverageTicket)],
        ["Execution Planner Required Average Ticket", formatCurrency(summary.executionPlanner.requiredAverageTicket)],
        ["Execution Planner Average Ticket Lift (%)", summary.executionPlanner.averageTicketLiftPct.toFixed(1)],
        ["Execution Planner Focus Sources", summary.executionPlanner.recommendedFocusSources.join(" | ") || "-"],
        ["Execution Planner Peak Hours", summary.executionPlanner.recommendedPeakHours.join(" | ") || "-"],
        ["Execution Planner Slow Hours", summary.executionPlanner.recommendedSlowHours.join(" | ") || "-"],
        ["Execution Planner Primary Action", summary.executionPlanner.primaryAction],
        ["Execution Planner Secondary Action", summary.executionPlanner.secondaryAction],
        ["Daily Mission Status", summary.dailyMission.status],
        ["Daily Mission Label", summary.dailyMission.label],
        ["Daily Mission Required Revenue", formatCurrency(summary.dailyMission.requiredRevenue)],
        ["Daily Mission Achieved Revenue", formatCurrency(summary.dailyMission.achievedRevenue)],
        ["Daily Mission Revenue Progress (%)", summary.dailyMission.revenueProgressPct.toFixed(1)],
        ["Daily Mission Revenue Gap", formatCurrency(summary.dailyMission.revenueGap)],
        ["Daily Mission Required Transactions", summary.dailyMission.requiredTransactions.toFixed(1)],
        ["Daily Mission Achieved Transactions", summary.dailyMission.achievedTransactions],
        ["Daily Mission Transactions Progress (%)", summary.dailyMission.transactionsProgressPct.toFixed(1)],
        ["Daily Mission Required Average Ticket", formatCurrency(summary.dailyMission.requiredAverageTicket)],
        ["Daily Mission Achieved Average Ticket", formatCurrency(summary.dailyMission.achievedAverageTicket)],
        ["Daily Mission Average Ticket Progress (%)", summary.dailyMission.averageTicketProgressPct.toFixed(1)],
        ["Daily Mission Focus", summary.dailyMission.focusMessage],
        ["Daily Mission Next Actions", summary.dailyMission.nextActions.join(" | ") || "-"],
        ["Consistency State", summary.consistencyRadar.state],
        ["Consistency Score", summary.consistencyRadar.score],
        ["Consistency Volatility (%)", summary.consistencyRadar.volatilityPct.toFixed(1)],
        ["Consistency Active Days", summary.consistencyRadar.activeDays],
        ["Consistency Active Days (%)", summary.consistencyRadar.activeDaysPct.toFixed(1)],
        ["Consistency Zero Sales Days", summary.consistencyRadar.zeroSalesDays],
        ["Consistency Best Streak", summary.consistencyRadar.bestStreakDays],
        ["Consistency Weak Streak", summary.consistencyRadar.weakStreakDays],
        ["Consistency Recommendation", summary.consistencyRadar.recommendation],
        ["Scenario Volatility (%)", summary.targetScenarioSimulator.volatilityPct.toFixed(1)],
        ["Scenario Baseline Daily Revenue", formatCurrency(summary.targetScenarioSimulator.baselineDailyRevenue)],
        ["Scenario Baseline Transactions/Day", summary.targetScenarioSimulator.baselineTransactionsPerDay.toFixed(1)],
        ["Scenario Baseline Average Ticket", formatCurrency(summary.targetScenarioSimulator.baselineAverageTicket)],
        ["Scenario Best Win", bestWinScenario ? `${bestWinScenario.label} (${bestWinScenario.winProbabilityPct.toFixed(1)}%)` : "-"],
        ["Scenario Best Projection", bestProjectedScenario ? `${bestProjectedScenario.label} (${formatCurrency(bestProjectedScenario.projectedMonthEndRevenue)})` : "-"],
        ["Anomaly Baseline Days", summary.anomalyRadar.baselineDays],
        ["Anomaly Stable Hours (%)", summary.anomalyRadar.stableHoursPct.toFixed(1)],
        ["Anomaly Alert Hours", summary.anomalyRadar.alertHours],
        ["Anomaly Opportunity Hours", summary.anomalyRadar.opportunityHours],
        ["Anomaly Summary", summary.anomalyRadar.summary],
        ["Source Playbook Primary Focus", summary.sourcePlaybook.primaryFocus]
      ];

      rows.push([]);
      rows.push([`Revenue Trend (${summary.trendPeriodDays} Hari)`]);
      rows.push(["Date", "Day Label", "Revenue", "Transactions"]);
      summary.weekRevenue.forEach((point) => {
        rows.push([point.date, point.label, point.revenue, point.transactions]);
      });

      rows.push([]);
      rows.push(["Source Mix Hari Ini"]);
      rows.push(["Source", "Transactions", "Revenue", "Share Transactions (%)", "Share Revenue (%)"]);
      summary.sourceMix.forEach((source) => {
        rows.push([
          source.source,
          source.transactions,
          source.revenue,
          source.shareTransactionsPct.toFixed(1),
          source.shareRevenuePct.toFixed(1)
        ]);
      });

      rows.push([]);
      rows.push([`Day Type Mix (${summary.trendPeriodDays} Hari)`]);
      rows.push(["Day Type", "Revenue", "Transactions", "Average Ticket", "Share Revenue (%)"]);
      summary.dayTypeMix.forEach((point) => {
        rows.push([
          point.label,
          point.revenue,
          point.transactions,
          point.averageTicket,
          point.shareRevenuePct.toFixed(1)
        ]);
      });

      rows.push([]);
      rows.push(["Filtered Snapshot"]);
      rows.push(["Metric", "Value"]);
      rows.push(["Label", summary.filteredSnapshot.label]);
      rows.push(["Revenue (Current Window)", summary.filteredSnapshot.revenueTotal]);
      rows.push(["Revenue (Previous Window)", summary.filteredSnapshot.revenuePrevious]);
      rows.push(["Revenue Delta (%)", summary.filteredSnapshot.revenueDeltaPct.toFixed(1)]);
      rows.push(["Transactions (Current Window)", summary.filteredSnapshot.transactionsTotal]);
      rows.push(["Transactions (Previous Window)", summary.filteredSnapshot.transactionsPrevious]);
      rows.push(["Transactions Delta (%)", summary.filteredSnapshot.transactionsDeltaPct.toFixed(1)]);
      rows.push(["Average Ticket", summary.filteredSnapshot.averageTicket]);
      rows.push(["Peak Hour", summary.filteredSnapshot.peakHourLabel]);
      rows.push(["Projected Monthly Revenue", summary.filteredSnapshot.projectedMonthlyRevenue]);
      rows.push(["Best Day", summary.filteredSnapshot.bestDayLabel]);
      rows.push(["Worst Day", summary.filteredSnapshot.worstDayLabel]);

      rows.push([]);
      rows.push(["Filtered Daily Breakdown"]);
      rows.push(["Date", "Label", "Revenue", "Transactions", "Average Ticket"]);
      summary.filteredDailyBreakdown.forEach((point) => {
        rows.push([point.date, point.label, point.revenue, point.transactions, point.averageTicket]);
      });

      rows.push([]);
      rows.push(["Period Benchmark Matrix"]);
      rows.push([
        "Period (Days)",
        "Revenue Current",
        "Revenue Previous",
        "Revenue Delta (%)",
        "Transactions Current",
        "Transactions Previous",
        "Transactions Delta (%)",
        "Average Daily Revenue",
        "Projected Monthly Revenue",
        "Active Days",
        "Active Days (%)"
      ]);
      summary.periodBenchmarks.forEach((benchmark) => {
        rows.push([
          benchmark.periodDays,
          benchmark.revenueTotal,
          benchmark.revenuePrevious,
          benchmark.revenueDeltaPct.toFixed(1),
          benchmark.transactionsTotal,
          benchmark.transactionsPrevious,
          benchmark.transactionsDeltaPct.toFixed(1),
          benchmark.averageDailyRevenue,
          benchmark.projectedMonthlyRevenue,
          benchmark.activeDays,
          benchmark.activeDaysPct.toFixed(1)
        ]);
      });

      rows.push([]);
      rows.push(["Product Momentum Lens"]);
      rows.push([
        "Product ID",
        "Name",
        "Qty Current",
        "Qty Previous",
        "Qty Delta (%)",
        "Revenue Current",
        "Revenue Previous",
        "Revenue Delta (%)",
        "Share Revenue Current (%)",
        "Share Revenue Previous (%)",
        "Trend"
      ]);
      summary.productMomentum.forEach((item) => {
        rows.push([
          item.productId,
          item.name,
          item.qtyCurrent,
          item.qtyPrevious,
          item.qtyDeltaPct.toFixed(1),
          item.revenueCurrent,
          item.revenuePrevious,
          item.revenueDeltaPct.toFixed(1),
          item.shareRevenueCurrentPct.toFixed(1),
          item.shareRevenuePreviousPct.toFixed(1),
          item.trend
        ]);
      });

      rows.push([]);
      rows.push(["Source Momentum Matrix"]);
      rows.push([
        "Source",
        "Label",
        "Revenue Current",
        "Revenue Previous",
        "Revenue Delta (%)",
        "Transactions Current",
        "Transactions Previous",
        "Transactions Delta (%)",
        "Average Ticket Current",
        "Average Ticket Previous",
        "Share Revenue Current (%)",
        "Share Revenue Previous (%)",
        "Momentum"
      ]);
      summary.sourceMomentum.forEach((item) => {
        rows.push([
          item.source,
          item.label,
          item.revenueCurrent,
          item.revenuePrevious,
          item.revenueDeltaPct.toFixed(1),
          item.transactionsCurrent,
          item.transactionsPrevious,
          item.transactionsDeltaPct.toFixed(1),
          item.averageTicketCurrent,
          item.averageTicketPrevious,
          item.shareRevenueCurrentPct.toFixed(1),
          item.shareRevenuePreviousPct.toFixed(1),
          item.momentum
        ]);
      });

      rows.push([]);
      rows.push(["Anomaly Radar"]);
      rows.push([
        "Hour",
        "Today Revenue",
        "Baseline Revenue",
        "Today Transactions",
        "Baseline Transactions",
        "Deviation (%)",
        "Level",
        "Action"
      ]);
      summary.anomalyRadar.notableHours.forEach((item) => {
        rows.push([
          item.label,
          item.todayRevenue,
          item.baselineRevenue,
          item.todayTransactions,
          item.baselineTransactions.toFixed(1),
          item.deviationPct.toFixed(1),
          item.level,
          item.action
        ]);
      });

      rows.push([]);
      rows.push(["Source Execution Playbook"]);
      rows.push([
        "Source",
        "Label",
        "Priority",
        "Momentum",
        "Revenue Share (%)",
        "Revenue Delta (%)",
        "Transactions Delta (%)",
        "Confidence",
        "Action"
      ]);
      summary.sourcePlaybook.items.forEach((item) => {
        rows.push([
          item.source,
          item.label,
          item.priority,
          item.momentum,
          item.revenueSharePct.toFixed(1),
          item.revenueDeltaPct.toFixed(1),
          item.transactionsDeltaPct.toFixed(1),
          item.confidenceScore,
          item.action
        ]);
      });

      rows.push([]);
      rows.push(["Daily Mission Tracker"]);
      rows.push(["Metric", "Value"]);
      rows.push(["Status", summary.dailyMission.status]);
      rows.push(["Label", summary.dailyMission.label]);
      rows.push(["Required Revenue", summary.dailyMission.requiredRevenue]);
      rows.push(["Achieved Revenue", summary.dailyMission.achievedRevenue]);
      rows.push(["Revenue Progress (%)", summary.dailyMission.revenueProgressPct.toFixed(1)]);
      rows.push(["Revenue Gap", summary.dailyMission.revenueGap]);
      rows.push(["Required Transactions", summary.dailyMission.requiredTransactions.toFixed(1)]);
      rows.push(["Achieved Transactions", summary.dailyMission.achievedTransactions]);
      rows.push(["Transactions Progress (%)", summary.dailyMission.transactionsProgressPct.toFixed(1)]);
      rows.push(["Transaction Gap", summary.dailyMission.transactionGap.toFixed(1)]);
      rows.push(["Required Average Ticket", summary.dailyMission.requiredAverageTicket]);
      rows.push(["Achieved Average Ticket", summary.dailyMission.achievedAverageTicket]);
      rows.push(["Average Ticket Progress (%)", summary.dailyMission.averageTicketProgressPct.toFixed(1)]);
      rows.push(["Focus", summary.dailyMission.focusMessage]);

      rows.push([]);
      rows.push(["Daily Mission Next Actions"]);
      rows.push(["Action"]);
      summary.dailyMission.nextActions.forEach((action) => {
        rows.push([action]);
      });

      rows.push([]);
      rows.push(["Consistency Radar"]);
      rows.push(["Metric", "Value"]);
      rows.push(["State", summary.consistencyRadar.state]);
      rows.push(["Score", summary.consistencyRadar.score]);
      rows.push(["Volatility (%)", summary.consistencyRadar.volatilityPct.toFixed(1)]);
      rows.push(["Active Days", summary.consistencyRadar.activeDays]);
      rows.push(["Active Days (%)", summary.consistencyRadar.activeDaysPct.toFixed(1)]);
      rows.push(["Zero Sales Days", summary.consistencyRadar.zeroSalesDays]);
      rows.push(["Best Streak (Days)", summary.consistencyRadar.bestStreakDays]);
      rows.push(["Weak Streak (Days)", summary.consistencyRadar.weakStreakDays]);
      rows.push(["Recommendation", summary.consistencyRadar.recommendation]);

      rows.push([]);
      rows.push(["Target Scenario Simulator"]);
      rows.push([
        "Scenario",
        "Projected Month End Revenue",
        "Target Gap",
        "Projected Progress (%)",
        "Required Daily Revenue",
        "Required Transactions/Day",
        "Required Average Ticket",
        "Win Probability (%)",
        "Action"
      ]);
      summary.targetScenarioSimulator.scenarios.forEach((scenario) => {
        rows.push([
          scenario.label,
          scenario.projectedMonthEndRevenue,
          scenario.targetGap,
          scenario.projectedProgressPct.toFixed(1),
          scenario.requiredDailyRevenue,
          scenario.requiredTransactionsPerDay.toFixed(1),
          scenario.requiredAverageTicket,
          scenario.winProbabilityPct.toFixed(1),
          scenario.action
        ]);
      });

      rows.push([]);
      rows.push(["Monthly Target Tracker"]);
      rows.push(["Metric", "Value"]);
      rows.push(["Monthly Target", summary.monthlyTargetTracker.monthlyTarget]);
      rows.push(["Month To Date Revenue", summary.monthlyTargetTracker.monthToDateRevenue]);
      rows.push(["Month To Date Transactions", summary.monthlyTargetTracker.monthToDateTransactions]);
      rows.push(["Elapsed Days", summary.monthlyTargetTracker.elapsedDaysInMonth]);
      rows.push(["Total Days In Month", summary.monthlyTargetTracker.totalDaysInMonth]);
      rows.push(["Remaining Days", summary.monthlyTargetTracker.remainingDaysInMonth]);
      rows.push(["Target Progress (%)", summary.monthlyTargetTracker.targetProgressPct]);
      rows.push(["Time Progress (%)", summary.monthlyTargetTracker.timeProgressPct]);
      rows.push(["Projected Month End Revenue", summary.monthlyTargetTracker.projectedMonthEndRevenue]);
      rows.push(["Required Daily Revenue", summary.monthlyTargetTracker.requiredDailyRevenueForTarget]);
      rows.push(["Target Gap", summary.monthlyTargetTracker.targetGap]);
      rows.push(["Status", summary.monthlyTargetTracker.status]);

      rows.push([]);
      rows.push(["Top Products Hari Ini"]);
      rows.push(["Product ID", "Name", "Qty", "Gross"]);
      summary.topProducts.forEach((product) => {
        rows.push([product.productId, product.name, product.qty, product.gross]);
      });

      rows.push([]);
      rows.push(["Hourly Performance Hari Ini"]);
      rows.push(["Hour", "Transactions", "Revenue"]);
      summary.hourlySales.forEach((point) => {
        rows.push([point.label, point.transactions, point.revenue]);
      });

      rows.push([]);
      rows.push(["Recent Sales"]);
      rows.push(["Sale ID", "Total", "Source", "Created At"]);
      summary.recentSales.forEach((sale) => {
        rows.push([sale.id, sale.total, sale.source, new Date(sale.createdAt).toLocaleString("id-ID")]);
      });

      rows.push([]);
      rows.push(["Actionable Insights"]);
      rows.push(["Level", "Title", "Detail", "Action Label", "Action Href"]);
      summary.insights.forEach((insight) => {
        rows.push([insight.level, insight.title, insight.detail, insight.actionLabel, insight.actionHref]);
      });

      rows.push([]);
      rows.push(["Health Focus"]);
      rows.push(["Priority Action"]);
      summary.healthFocus.forEach((focus) => {
        rows.push([focus]);
      });

      rows.push([]);
      rows.push(["Operational Alerts"]);
      rows.push(["Level", "Title", "Detail"]);
      summary.alerts.forEach((alert) => {
        rows.push([alert.level, alert.title, alert.detail]);
      });

      const csv = rows
        .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-${tenantId}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownloadCsv}
      disabled={!summary || !tenantId || isExporting}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isExporting ? "Mempersiapkan CSV..." : "Export CSV"}
    </button>
  );
}
