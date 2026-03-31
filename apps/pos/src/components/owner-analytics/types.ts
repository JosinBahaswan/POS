import type { LocalSale } from "../../database";

export type OwnerAnalyticsPeriod = "7d" | "30d" | "month";

export type PaymentMethodSummary = {
  key: "cash" | "card" | "qris";
  label: string;
  count: number;
  total: number;
  percent: number;
  barClass: string;
};

export type TimeSlotSummary = {
  label: string;
  count: number;
  percent: number;
};

export type TopProductSummary = {
  name: string;
  qty: number;
};

export type TrendSummary = {
  label: string;
  revenue: number;
};

export type DailyBreakdownSummary = {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
  averageTicket: number;
};

export type OutletSummary = {
  outletId: string;
  omzet: number;
  trx: number;
};

export type PaymentMomentumTrend = "accelerating" | "stable" | "cooling";

export type PaymentMomentumSummary = {
  key: "cash" | "card" | "qris";
  label: string;
  revenueCurrent: number;
  revenuePrevious: number;
  revenueDeltaPct: number;
  transactionsCurrent: number;
  transactionsPrevious: number;
  transactionsDeltaPct: number;
  averageTicketCurrent: number;
  averageTicketPrevious: number;
  shareRevenueCurrentPct: number;
  shareRevenuePreviousPct: number;
  momentum: PaymentMomentumTrend;
};

export type HourlyAnomalyLevel = "alert" | "watch" | "opportunity";

export type HourlyAnomalySummary = {
  hour: number;
  label: string;
  todayRevenue: number;
  baselineRevenue: number;
  todayTransactions: number;
  baselineTransactions: number;
  deviationPct: number;
  level: HourlyAnomalyLevel;
  action: string;
};

export type AnomalyRadarSummary = {
  baselineDays: number;
  stableHoursPct: number;
  alertHours: number;
  opportunityHours: number;
  notableHours: HourlyAnomalySummary[];
  summary: string;
};

export type ExecutionPlannerStatus = "off" | "on-track" | "needs-push" | "critical";

export type ExecutionPlannerSummary = {
  status: ExecutionPlannerStatus;
  baselineDailyRevenue: number;
  requiredDailyRevenue: number;
  dailyRevenueGap: number;
  baselineTransactionsPerDay: number;
  requiredTransactionsPerDay: number;
  transactionsLiftPct: number;
  baselineAverageTicket: number;
  requiredAverageTicket: number;
  averageTicketLiftPct: number;
  recommendedFocusPayments: string[];
  recommendedPeakHours: string[];
  recommendedSlowHours: string[];
  primaryAction: string;
  secondaryAction: string;
};

export type DailyMissionStatus = "off" | "ahead" | "on-track" | "behind";

export type DailyMissionSummary = {
  status: DailyMissionStatus;
  label: string;
  requiredRevenue: number;
  achievedRevenue: number;
  revenueProgressPct: number;
  revenueGap: number;
  requiredTransactions: number;
  achievedTransactions: number;
  transactionsProgressPct: number;
  transactionGap: number;
  requiredAverageTicket: number;
  achievedAverageTicket: number;
  averageTicketProgressPct: number;
  focusMessage: string;
  nextActions: string[];
};

export type ConsistencyState = "stable" | "volatile" | "fragile";

export type ConsistencyRadarSummary = {
  state: ConsistencyState;
  score: number;
  volatilityPct: number;
  activeDays: number;
  activeDaysPct: number;
  zeroSalesDays: number;
  bestStreakDays: number;
  weakStreakDays: number;
  recommendation: string;
};

export type TargetScenarioLevel = "conservative" | "baseline" | "stretch";

export type TargetScenarioSummary = {
  level: TargetScenarioLevel;
  label: string;
  projectedMonthEndRevenue: number;
  targetGap: number;
  projectedProgressPct: number;
  requiredDailyRevenue: number;
  requiredTransactionsPerDay: number;
  requiredAverageTicket: number;
  winProbabilityPct: number;
  action: string;
};

export type TargetScenarioSimulatorSummary = {
  baselineDailyRevenue: number;
  baselineTransactionsPerDay: number;
  baselineAverageTicket: number;
  volatilityPct: number;
  scenarios: TargetScenarioSummary[];
};

export type OwnerAnalyticsData = {
  omzetToday: number;
  cogsToday: number;
  marginToday: number;
  marginPercent: number;
  trxToday: number;
  avgTicket: number;
  totalDiscount: number;
  refundedToday: number;
  voidedToday: number;
  paymentSummary: PaymentMethodSummary[];
  timeSlotSummary: TimeSlotSummary[];
  topProducts: TopProductSummary[];
  trend: TrendSummary[];
  maxTrendRevenue: number;
  periodDays: number;
  periodDailyBreakdown: DailyBreakdownSummary[];
  periodSales: LocalSale[];
  periodCompleted: LocalSale[];
  periodRevenue: number;
  periodMargin: number;
  periodMarginPercent: number;
  outletSummary: OutletSummary[];
  monthlyTarget: number;
  monthToDateRevenue: number;
  monthToDateTransactions: number;
  elapsedDaysInMonth: number;
  totalDaysInMonth: number;
  targetProgressPct: number;
  timeProgressPct: number;
  projectedMonthEndRevenue: number;
  requiredDailyRevenueForTarget: number;
  targetGap: number;
  paymentMomentum: PaymentMomentumSummary[];
  anomalyRadar: AnomalyRadarSummary;
  executionPlanner: ExecutionPlannerSummary;
  dailyMission: DailyMissionSummary;
  consistencyRadar: ConsistencyRadarSummary;
  targetScenarioSimulator: TargetScenarioSimulatorSummary;
};
