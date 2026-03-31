import { getSupabaseServerClient } from "./supabase-server";

export type DashboardTrendPoint = {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
};

export type DashboardRecentSale = {
  id: string;
  total: number;
  createdAt: string;
  source: string;
};

export type DashboardAlert = {
  level: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

export type DashboardSourceMixPoint = {
  source: string;
  transactions: number;
  revenue: number;
  shareTransactionsPct: number;
  shareRevenuePct: number;
};

export type DashboardTopProduct = {
  productId: string;
  name: string;
  qty: number;
  gross: number;
};

export type DashboardHourlyPoint = {
  hour: number;
  label: string;
  transactions: number;
  revenue: number;
};

export type DashboardInsight = {
  level: "high" | "medium" | "low";
  title: string;
  detail: string;
  actionLabel: string;
  actionHref: string;
};

export type DashboardDayTypePoint = {
  dayType: "weekday" | "weekend";
  label: string;
  revenue: number;
  transactions: number;
  averageTicket: number;
  shareRevenuePct: number;
};

export type DashboardHealthLabel = "Excellent" | "Good" | "Watch" | "Critical";

export type DashboardSourceFilter = "all" | "pos-pwa" | "web" | "mobile" | "kiosk" | "unknown";

export type DashboardDayTypeFilter = "all" | "weekday" | "weekend";

export type DashboardActiveFilters = {
  source: DashboardSourceFilter;
  dayType: DashboardDayTypeFilter;
};

export type DashboardFilteredSnapshot = {
  label: string;
  revenueTotal: number;
  revenuePrevious: number;
  revenueDeltaPct: number;
  transactionsTotal: number;
  transactionsPrevious: number;
  transactionsDeltaPct: number;
  averageTicket: number;
  peakHourLabel: string;
  projectedMonthlyRevenue: number;
  bestDayLabel: string;
  worstDayLabel: string;
};

export type DashboardMonthlyTargetStatus = "no-target" | "on-track" | "at-risk" | "behind";

export type DashboardMonthlyTargetTracker = {
  monthlyTarget: number;
  monthToDateRevenue: number;
  monthToDateTransactions: number;
  elapsedDaysInMonth: number;
  totalDaysInMonth: number;
  remainingDaysInMonth: number;
  targetProgressPct: number;
  timeProgressPct: number;
  projectedMonthEndRevenue: number;
  requiredDailyRevenueForTarget: number;
  targetGap: number;
  status: DashboardMonthlyTargetStatus;
};

export type DashboardFilteredDailyPoint = {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
  averageTicket: number;
};

export type DashboardPeriodBenchmark = {
  periodDays: 7 | 14 | 30;
  revenueTotal: number;
  revenuePrevious: number;
  revenueDeltaPct: number;
  transactionsTotal: number;
  transactionsPrevious: number;
  transactionsDeltaPct: number;
  averageDailyRevenue: number;
  projectedMonthlyRevenue: number;
  activeDays: number;
  activeDaysPct: number;
};

export type DashboardProductMomentumTrend = "rising" | "declining" | "flat";

export type DashboardProductMomentumItem = {
  productId: string;
  name: string;
  qtyCurrent: number;
  qtyPrevious: number;
  qtyDeltaPct: number;
  revenueCurrent: number;
  revenuePrevious: number;
  revenueDeltaPct: number;
  shareRevenueCurrentPct: number;
  shareRevenuePreviousPct: number;
  trend: DashboardProductMomentumTrend;
};

export type DashboardSourceMomentumTrend = "accelerating" | "stable" | "cooling";

export type DashboardSourceMomentumItem = {
  source: string;
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
  momentum: DashboardSourceMomentumTrend;
};

export type DashboardExecutionPlannerStatus = "off" | "on-track" | "needs-push" | "critical";

export type DashboardExecutionPlanner = {
  status: DashboardExecutionPlannerStatus;
  baselineDailyRevenue: number;
  requiredDailyRevenue: number;
  dailyRevenueGap: number;
  baselineTransactionsPerDay: number;
  requiredTransactionsPerDay: number;
  transactionsLiftPct: number;
  baselineAverageTicket: number;
  requiredAverageTicket: number;
  averageTicketLiftPct: number;
  recommendedFocusSources: string[];
  recommendedPeakHours: string[];
  recommendedSlowHours: string[];
  primaryAction: string;
  secondaryAction: string;
};

export type DashboardDailyMissionStatus = "off" | "ahead" | "on-track" | "behind";

export type DashboardDailyMission = {
  status: DashboardDailyMissionStatus;
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

export type DashboardConsistencyState = "stable" | "volatile" | "fragile";

export type DashboardConsistencyRadar = {
  state: DashboardConsistencyState;
  score: number;
  volatilityPct: number;
  activeDays: number;
  activeDaysPct: number;
  zeroSalesDays: number;
  bestStreakDays: number;
  weakStreakDays: number;
  recommendation: string;
};

export type DashboardTargetScenarioLevel = "conservative" | "baseline" | "stretch";

export type DashboardTargetScenarioItem = {
  level: DashboardTargetScenarioLevel;
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

export type DashboardTargetScenarioSimulator = {
  baselineDailyRevenue: number;
  baselineTransactionsPerDay: number;
  baselineAverageTicket: number;
  volatilityPct: number;
  scenarios: DashboardTargetScenarioItem[];
};

export type DashboardAnomalyLevel = "alert" | "watch" | "opportunity";

export type DashboardHourlyAnomalyItem = {
  hour: number;
  label: string;
  todayRevenue: number;
  baselineRevenue: number;
  todayTransactions: number;
  baselineTransactions: number;
  deviationPct: number;
  level: DashboardAnomalyLevel;
  action: string;
};

export type DashboardAnomalyRadar = {
  baselineDays: number;
  stableHoursPct: number;
  alertHours: number;
  opportunityHours: number;
  notableHours: DashboardHourlyAnomalyItem[];
  summary: string;
};

export type DashboardSourcePlaybookPriority = "scale" | "stabilize" | "recover" | "test";

export type DashboardSourcePlaybookItem = {
  source: string;
  label: string;
  priority: DashboardSourcePlaybookPriority;
  momentum: DashboardSourceMomentumTrend;
  revenueSharePct: number;
  revenueDeltaPct: number;
  transactionsDeltaPct: number;
  confidenceScore: number;
  action: string;
};

export type DashboardSourcePlaybook = {
  primaryFocus: string;
  items: DashboardSourcePlaybookItem[];
};

export type DashboardSummary = {
  tenantId: string;
  todayRevenue: number;
  todayTransactions: number;
  yesterdayRevenue: number;
  yesterdayTransactions: number;
  revenueDeltaPct: number;
  transactionsDeltaPct: number;
  averageTicketToday: number;
  averageTicketYesterday: number;
  averageTicketDeltaPct: number;
  pendingSync: number;
  subscriptionStatus: string;
  activeCashiers: number;
  activeManagers: number;
  activeProducts: number;
  lastTransactionAt: string | null;
  generatedAt: string;
  trendPeriodDays: number;
  trendRevenueTotal: number;
  trendRevenuePrevious: number;
  trendRevenueDeltaPct: number;
  trendTransactionsTotal: number;
  trendTransactionsPrevious: number;
  trendTransactionsDeltaPct: number;
  trendAverageDailyRevenue: number;
  projectedMonthlyRevenue: number;
  trendPeakDayLabel: string;
  weekRevenue: DashboardTrendPoint[];
  recentSales: DashboardRecentSale[];
  alerts: DashboardAlert[];
  sourceMix: DashboardSourceMixPoint[];
  topProducts: DashboardTopProduct[];
  dayTypeMix: DashboardDayTypePoint[];
  hourlySales: DashboardHourlyPoint[];
  bestHourLabel: string;
  activeFilters: DashboardActiveFilters;
  filteredSnapshot: DashboardFilteredSnapshot;
  filteredDailyBreakdown: DashboardFilteredDailyPoint[];
  periodBenchmarks: DashboardPeriodBenchmark[];
  productMomentum: DashboardProductMomentumItem[];
  sourceMomentum: DashboardSourceMomentumItem[];
  anomalyRadar: DashboardAnomalyRadar;
  sourcePlaybook: DashboardSourcePlaybook;
  monthlyTargetTracker: DashboardMonthlyTargetTracker;
  executionPlanner: DashboardExecutionPlanner;
  dailyMission: DashboardDailyMission;
  consistencyRadar: DashboardConsistencyRadar;
  targetScenarioSimulator: DashboardTargetScenarioSimulator;
  healthScore: number;
  healthLabel: DashboardHealthLabel;
  healthFocus: string[];
  insights: DashboardInsight[];
};

type RawSaleRow = {
  id: string;
  total: number | string;
  created_at: string;
  source: string | null;
  line_items: unknown;
};

type RawProfileWithStatus = {
  role: string;
  is_active: boolean;
};

type RawProfileFallback = {
  role: string;
};

type ParsedLineItem = {
  productId: string;
  name: string;
  qty: number;
  gross: number;
};

type ProductMomentumAggregate = {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
};

type DashboardSummaryOptions = {
  periodDays?: number;
  source?: DashboardSourceFilter | string;
  dayType?: DashboardDayTypeFilter | string;
  monthlyTarget?: number;
};

const DEFAULT_PERIOD_DAYS = 7;
const BENCHMARK_PERIODS = [7, 14, 30] as const;
const SOURCE_FILTER_VALUES: DashboardSourceFilter[] = ["all", "pos-pwa", "web", "mobile", "kiosk", "unknown"];
const DAY_TYPE_FILTER_VALUES: DashboardDayTypeFilter[] = ["all", "weekday", "weekend"];

const SOURCE_FILTER_LABELS: Record<DashboardSourceFilter, string> = {
  all: "Semua Source",
  "pos-pwa": "POS PWA",
  web: "Web",
  mobile: "Mobile",
  kiosk: "Kiosk",
  unknown: "Unknown"
};

const DAY_TYPE_FILTER_LABELS: Record<DashboardDayTypeFilter, string> = {
  all: "Semua Hari",
  weekday: "Hari Kerja",
  weekend: "Akhir Pekan"
};

const SOURCE_PLAYBOOK_PRIORITY_WEIGHTS: Record<DashboardSourcePlaybookPriority, number> = {
  recover: 4,
  scale: 3,
  stabilize: 2,
  test: 1
};

const toSourceLabel = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (SOURCE_FILTER_VALUES.includes(normalized as DashboardSourceFilter)) {
    return SOURCE_FILTER_LABELS[normalized as DashboardSourceFilter];
  }

  return normalized.length > 0 ? normalized.toUpperCase() : "UNKNOWN";
};

const toNumber = (value: number | string | null | undefined): number => {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
};

const clampPercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-999, Math.min(999, value));
};

const calcDeltaPct = (current: number, previous: number): number => {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

const round = (value: number, fractionDigits = 1) => {
  const base = Math.pow(10, fractionDigits);
  return Math.round(value * base) / base;
};

const startOfLocalDay = (reference: Date) => {
  const next = new Date(reference);
  next.setHours(0, 0, 0, 0);
  return next;
};

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isWithinRange = (target: Date, start: Date, end: Date) => {
  const time = target.getTime();
  return time >= start.getTime() && time < end.getTime();
};

const normalizeSource = (value: string | null | undefined) => {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : "unknown";
};

const resolvePeriodDays = (value: number | undefined) => {
  return value === 7 || value === 14 || value === 30 ? value : DEFAULT_PERIOD_DAYS;
};

const resolveSourceFilter = (value: DashboardSummaryOptions["source"]): DashboardSourceFilter => {
  const normalized = String(value ?? "all").trim().toLowerCase() as DashboardSourceFilter;
  return SOURCE_FILTER_VALUES.includes(normalized) ? normalized : "all";
};

const resolveDayTypeFilter = (value: DashboardSummaryOptions["dayType"]): DashboardDayTypeFilter => {
  const normalized = String(value ?? "all").trim().toLowerCase() as DashboardDayTypeFilter;
  return DAY_TYPE_FILTER_VALUES.includes(normalized) ? normalized : "all";
};

const isWeekendDay = (value: Date) => {
  const day = value.getDay();
  return day === 0 || day === 6;
};

const matchesDayTypeFilter = (createdAt: string, dayTypeFilter: DashboardDayTypeFilter) => {
  if (dayTypeFilter === "all") return true;

  const weekend = isWeekendDay(new Date(createdAt));
  return dayTypeFilter === "weekend" ? weekend : !weekend;
};

const toHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const parseSaleLineItems = (lineItems: unknown): ParsedLineItem[] => {
  if (!Array.isArray(lineItems)) return [];

  return lineItems
    .map((rawItem, index) => {
      if (!rawItem || typeof rawItem !== "object") return null;

      const item = rawItem as Record<string, unknown>;
      const qty = Math.max(0, Math.round(toNumber(item.qty as number | string | null | undefined)));
      if (qty <= 0) return null;

      const unitPrice = Math.max(
        0,
        toNumber((item.price ?? item.unitPrice ?? item.basePrice) as number | string | null | undefined)
      );

      const fallbackName = `Item ${index + 1}`;
      const name = String(item.name ?? item.productName ?? fallbackName).trim() || fallbackName;
      const productId = String(item.id ?? item.productId ?? name).trim() || name;

      return {
        productId,
        name,
        qty,
        gross: unitPrice * qty
      } satisfies ParsedLineItem;
    })
    .filter((item): item is ParsedLineItem => item !== null);
};

const aggregateProductMomentum = (salesRows: RawSaleRow[]) => {
  const productMap = new Map<string, ProductMomentumAggregate>();

  for (const sale of salesRows) {
    const parsedItems = parseSaleLineItems(sale.line_items);

    for (const item of parsedItems) {
      const current = productMap.get(item.productId);

      if (!current) {
        productMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          revenue: item.gross
        });
        continue;
      }

      current.qty += item.qty;
      current.revenue += item.gross;

      // Replace fallback labels like "Item 1" when a clearer product name appears later.
      if (current.name.startsWith("Item ") && !item.name.startsWith("Item ")) {
        current.name = item.name;
      }
    }
  }

  return productMap;
};

export async function getDashboardSummary(
  tenantId: string,
  options: DashboardSummaryOptions = {}
): Promise<DashboardSummary> {
  const supabase = getSupabaseServerClient();
  const periodDays = resolvePeriodDays(options.periodDays);
  const sourceFilter = resolveSourceFilter(options.source);
  const dayTypeFilter = resolveDayTypeFilter(options.dayType);
  const monthlyTarget = Math.max(0, Math.round(toNumber(options.monthlyTarget)));

  const generatedAt = new Date();
  const startOfDay = startOfLocalDay(generatedAt);
  const startOfMonth = new Date(startOfDay);
  startOfMonth.setDate(1);
  const startOfNextMonth = new Date(startOfMonth);
  startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfYesterday = new Date(startOfDay);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfTrendWindow = new Date(startOfDay);
  startOfTrendWindow.setDate(startOfTrendWindow.getDate() - (periodDays - 1));
  const startOfPreviousTrendWindow = new Date(startOfTrendWindow);
  startOfPreviousTrendWindow.setDate(startOfPreviousTrendWindow.getDate() - periodDays);
  const salesQueryStart = startOfPreviousTrendWindow.getTime() <= startOfMonth.getTime()
    ? startOfPreviousTrendWindow
    : startOfMonth;

  const [salesResult, subscriptionResult, pendingResult, productsResult, profilesResult] = await Promise.all([
    supabase
      .from("sales")
      .select("id,total,created_at,source,line_items")
      .eq("tenant_id", tenantId)
      .gte("created_at", salesQueryStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("source", "pos-pwa")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("active", true),
    supabase
      .from("profiles")
      .select("role,is_active")
      .eq("tenant_id", tenantId)
      .in("role", ["cashier", "manager"])
  ]);

  const salesRows = (salesResult.data ?? []) as RawSaleRow[];
  const lastTransactionAt = salesRows[0]?.created_at ?? null;

  const todaySales = salesRows.filter((row) => {
    const saleDate = new Date(row.created_at);
    return isWithinRange(saleDate, startOfDay, startOfTomorrow);
  });

  const yesterdaySales = salesRows.filter((row) => {
    const saleDate = new Date(row.created_at);
    return isWithinRange(saleDate, startOfYesterday, startOfDay);
  });

  const trendSales = salesRows.filter((row) => {
    const saleDate = new Date(row.created_at);
    return isWithinRange(saleDate, startOfTrendWindow, startOfTomorrow);
  });

  const previousTrendSales = salesRows.filter((row) => {
    const saleDate = new Date(row.created_at);
    return isWithinRange(saleDate, startOfPreviousTrendWindow, startOfTrendWindow);
  });

  const isSaleMatchedByFilter = (row: RawSaleRow) => {
    if (sourceFilter !== "all" && normalizeSource(row.source) !== sourceFilter) {
      return false;
    }

    if (!matchesDayTypeFilter(row.created_at, dayTypeFilter)) {
      return false;
    }

    return true;
  };

  const filteredTrendSales = trendSales.filter(isSaleMatchedByFilter);
  const filteredPreviousTrendSales = previousTrendSales.filter(isSaleMatchedByFilter);

  const todayRevenue = todaySales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const todayTransactions = todaySales.length;
  const yesterdayTransactions = yesterdaySales.length;

  const averageTicketToday = todayTransactions > 0 ? todayRevenue / todayTransactions : 0;
  const averageTicketYesterday = yesterdayTransactions > 0 ? yesterdayRevenue / yesterdayTransactions : 0;

  const revenueDeltaPct = clampPercent(calcDeltaPct(todayRevenue, yesterdayRevenue));
  const transactionsDeltaPct = clampPercent(calcDeltaPct(todayTransactions, yesterdayTransactions));
  const averageTicketDeltaPct = clampPercent(calcDeltaPct(averageTicketToday, averageTicketYesterday));

  const trendRevenueTotal = trendSales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const trendRevenuePrevious = previousTrendSales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const trendTransactionsTotal = trendSales.length;
  const trendTransactionsPrevious = previousTrendSales.length;
  const trendRevenueDeltaPct = clampPercent(calcDeltaPct(trendRevenueTotal, trendRevenuePrevious));
  const trendTransactionsDeltaPct = clampPercent(calcDeltaPct(trendTransactionsTotal, trendTransactionsPrevious));
  const trendAverageDailyRevenue = periodDays > 0 ? trendRevenueTotal / periodDays : 0;
  const projectedMonthlyRevenue = trendAverageDailyRevenue * 30;

  const periodBenchmarks: DashboardPeriodBenchmark[] = BENCHMARK_PERIODS.map((benchmarkDays) => {
    const startOfCurrentWindow = new Date(startOfDay);
    startOfCurrentWindow.setDate(startOfCurrentWindow.getDate() - (benchmarkDays - 1));
    const startOfPreviousWindow = new Date(startOfCurrentWindow);
    startOfPreviousWindow.setDate(startOfPreviousWindow.getDate() - benchmarkDays);

    const currentWindowSales = salesRows.filter((row) => {
      const saleDate = new Date(row.created_at);
      return isWithinRange(saleDate, startOfCurrentWindow, startOfTomorrow);
    });

    const previousWindowSales = salesRows.filter((row) => {
      const saleDate = new Date(row.created_at);
      return isWithinRange(saleDate, startOfPreviousWindow, startOfCurrentWindow);
    });

    const revenueCurrent = currentWindowSales.reduce((sum, row) => sum + toNumber(row.total), 0);
    const revenuePrevious = previousWindowSales.reduce((sum, row) => sum + toNumber(row.total), 0);
    const transactionsCurrent = currentWindowSales.length;
    const transactionsPrevious = previousWindowSales.length;
    const activeDays = new Set(currentWindowSales.map((row) => toDateKey(new Date(row.created_at)))).size;

    return {
      periodDays: benchmarkDays,
      revenueTotal: revenueCurrent,
      revenuePrevious,
      revenueDeltaPct: clampPercent(calcDeltaPct(revenueCurrent, revenuePrevious)),
      transactionsTotal: transactionsCurrent,
      transactionsPrevious,
      transactionsDeltaPct: clampPercent(calcDeltaPct(transactionsCurrent, transactionsPrevious)),
      averageDailyRevenue: benchmarkDays > 0 ? revenueCurrent / benchmarkDays : 0,
      projectedMonthlyRevenue: benchmarkDays > 0 ? (revenueCurrent / benchmarkDays) * 30 : 0,
      activeDays,
      activeDaysPct: benchmarkDays > 0 ? round((activeDays / benchmarkDays) * 100, 1) : 0
    } satisfies DashboardPeriodBenchmark;
  });

  const benchmark7 = periodBenchmarks.find((benchmark) => benchmark.periodDays === 7);
  const benchmark30 = periodBenchmarks.find((benchmark) => benchmark.periodDays === 30);

  const filteredRevenueTotal = filteredTrendSales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const filteredRevenuePrevious = filteredPreviousTrendSales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const filteredTransactionsTotal = filteredTrendSales.length;
  const filteredTransactionsPrevious = filteredPreviousTrendSales.length;
  const filteredRevenueDeltaPct = clampPercent(calcDeltaPct(filteredRevenueTotal, filteredRevenuePrevious));
  const filteredTransactionsDeltaPct = clampPercent(
    calcDeltaPct(filteredTransactionsTotal, filteredTransactionsPrevious)
  );
  const filteredAverageTicket = filteredTransactionsTotal > 0 ? filteredRevenueTotal / filteredTransactionsTotal : 0;

  const dayTypeTrendSales = trendSales.filter((row) => matchesDayTypeFilter(row.created_at, dayTypeFilter));
  const dayTypePreviousTrendSales = previousTrendSales.filter((row) =>
    matchesDayTypeFilter(row.created_at, dayTypeFilter)
  );

  const sourceMomentumCurrentMap = new Map<string, { transactions: number; revenue: number }>();
  for (const sale of dayTypeTrendSales) {
    const source = normalizeSource(sale.source);
    const current = sourceMomentumCurrentMap.get(source) ?? { transactions: 0, revenue: 0 };
    current.transactions += 1;
    current.revenue += toNumber(sale.total);
    sourceMomentumCurrentMap.set(source, current);
  }

  const sourceMomentumPreviousMap = new Map<string, { transactions: number; revenue: number }>();
  for (const sale of dayTypePreviousTrendSales) {
    const source = normalizeSource(sale.source);
    const current = sourceMomentumPreviousMap.get(source) ?? { transactions: 0, revenue: 0 };
    current.transactions += 1;
    current.revenue += toNumber(sale.total);
    sourceMomentumPreviousMap.set(source, current);
  }

  const sourceMomentumCurrentRevenueTotal = dayTypeTrendSales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const sourceMomentumPreviousRevenueTotal = dayTypePreviousTrendSales.reduce((sum, row) => sum + toNumber(row.total), 0);

  const sourceMomentumSourceSet = new Set<string>([
    ...sourceMomentumCurrentMap.keys(),
    ...sourceMomentumPreviousMap.keys()
  ]);

  if (sourceFilter !== "all") {
    sourceMomentumSourceSet.add(sourceFilter);
  }

  const sourceMomentum: DashboardSourceMomentumItem[] = Array.from(sourceMomentumSourceSet)
    .map((source) => {
      const current = sourceMomentumCurrentMap.get(source);
      const previous = sourceMomentumPreviousMap.get(source);
      const revenueCurrent = current?.revenue ?? 0;
      const revenuePrevious = previous?.revenue ?? 0;
      const transactionsCurrent = current?.transactions ?? 0;
      const transactionsPrevious = previous?.transactions ?? 0;
      const revenueDeltaPct = clampPercent(calcDeltaPct(revenueCurrent, revenuePrevious));
      const transactionsDeltaPct = clampPercent(calcDeltaPct(transactionsCurrent, transactionsPrevious));

      let momentum: DashboardSourceMomentumTrend = "stable";
      if (revenueDeltaPct >= 8 || transactionsDeltaPct >= 8) {
        momentum = "accelerating";
      } else if (revenueDeltaPct <= -8 || transactionsDeltaPct <= -8) {
        momentum = "cooling";
      }

      return {
        source,
        label: toSourceLabel(source),
        revenueCurrent,
        revenuePrevious,
        revenueDeltaPct,
        transactionsCurrent,
        transactionsPrevious,
        transactionsDeltaPct,
        averageTicketCurrent: transactionsCurrent > 0 ? revenueCurrent / transactionsCurrent : 0,
        averageTicketPrevious: transactionsPrevious > 0 ? revenuePrevious / transactionsPrevious : 0,
        shareRevenueCurrentPct: sourceMomentumCurrentRevenueTotal > 0
          ? round((revenueCurrent / sourceMomentumCurrentRevenueTotal) * 100, 1)
          : 0,
        shareRevenuePreviousPct: sourceMomentumPreviousRevenueTotal > 0
          ? round((revenuePrevious / sourceMomentumPreviousRevenueTotal) * 100, 1)
          : 0,
        momentum
      } satisfies DashboardSourceMomentumItem;
    })
    .filter((item) => item.transactionsCurrent > 0 || item.transactionsPrevious > 0)
    .sort((a, b) => {
      if (b.revenueCurrent !== a.revenueCurrent) {
        return b.revenueCurrent - a.revenueCurrent;
      }

      return b.revenueDeltaPct - a.revenueDeltaPct;
    })
    .slice(0, 8);

  const sourcePlaybookItems: DashboardSourcePlaybookItem[] = sourceMomentum
    .map((item) => {
      let priority: DashboardSourcePlaybookPriority = "test";
      let action = `Eksperimen kecil di ${item.label} untuk validasi demand tanpa alokasi budget besar.`;

      if (item.momentum === "cooling" && item.shareRevenueCurrentPct >= 15) {
        priority = "recover";
        action = `Pulihkan ${item.label} dengan campaign win-back dan evaluasi funnel checkout agar penurunan tidak berlanjut.`;
      } else if (item.momentum === "accelerating" && item.shareRevenueCurrentPct >= 20) {
        priority = "scale";
        action = `Skalakan ${item.label} karena momentum naik dan kontribusinya besar terhadap omzet.`;
      } else if (item.momentum === "stable" && item.shareRevenueCurrentPct >= 20) {
        priority = "stabilize";
        action = `Pertahankan performa ${item.label} lewat ritme promo ringan dan konsistensi operasional.`;
      } else if (item.momentum === "accelerating") {
        priority = "test";
        action = `Momentum ${item.label} mulai positif, uji kenaikan budget bertahap untuk melihat potensi scale.`;
      } else if (item.momentum === "cooling") {
        priority = "test";
        action = `Pantau ${item.label} dengan A/B offer sebelum masuk mode recovery penuh.`;
      }

      const sampleSize = item.transactionsCurrent + item.transactionsPrevious;
      const confidenceScore = Math.max(25, Math.min(100, Math.round(sampleSize * 2)));

      return {
        source: item.source,
        label: item.label,
        priority,
        momentum: item.momentum,
        revenueSharePct: item.shareRevenueCurrentPct,
        revenueDeltaPct: item.revenueDeltaPct,
        transactionsDeltaPct: item.transactionsDeltaPct,
        confidenceScore,
        action
      } satisfies DashboardSourcePlaybookItem;
    })
    .sort((a, b) => {
      const priorityDiff = SOURCE_PLAYBOOK_PRIORITY_WEIGHTS[b.priority] - SOURCE_PLAYBOOK_PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      if (b.revenueSharePct !== a.revenueSharePct) {
        return b.revenueSharePct - a.revenueSharePct;
      }

      return Math.abs(b.revenueDeltaPct) - Math.abs(a.revenueDeltaPct);
    });

  const sourcePlaybookTopItems = sourcePlaybookItems.slice(0, 5);
  const sourcePlaybookPrimaryFocus = sourcePlaybookTopItems[0]
    ? `${sourcePlaybookTopItems[0].label}: ${sourcePlaybookTopItems[0].action}`
    : "Belum ada data kanal yang cukup untuk menyusun playbook eksekusi.";

  const sourcePlaybook: DashboardSourcePlaybook = {
    primaryFocus: sourcePlaybookPrimaryFocus,
    items: sourcePlaybookTopItems
  };

  const productMomentumCurrent = aggregateProductMomentum(filteredTrendSales);
  const productMomentumPrevious = aggregateProductMomentum(filteredPreviousTrendSales);
  const productMomentumIds = new Set<string>([
    ...productMomentumCurrent.keys(),
    ...productMomentumPrevious.keys()
  ]);

  const productMomentum: DashboardProductMomentumItem[] = Array.from(productMomentumIds)
    .map((productId) => {
      const current = productMomentumCurrent.get(productId);
      const previous = productMomentumPrevious.get(productId);

      const qtyCurrent = current?.qty ?? 0;
      const qtyPrevious = previous?.qty ?? 0;
      const revenueCurrent = current?.revenue ?? 0;
      const revenuePrevious = previous?.revenue ?? 0;
      const qtyDeltaPct = clampPercent(calcDeltaPct(qtyCurrent, qtyPrevious));
      const revenueDeltaPct = clampPercent(calcDeltaPct(revenueCurrent, revenuePrevious));

      let trend: DashboardProductMomentumTrend = "flat";
      if (revenueDeltaPct >= 6 || qtyDeltaPct >= 8) {
        trend = "rising";
      } else if (revenueDeltaPct <= -6 || qtyDeltaPct <= -8) {
        trend = "declining";
      }

      return {
        productId,
        name: current?.name ?? previous?.name ?? productId,
        qtyCurrent,
        qtyPrevious,
        qtyDeltaPct,
        revenueCurrent,
        revenuePrevious,
        revenueDeltaPct,
        shareRevenueCurrentPct: filteredRevenueTotal > 0 ? round((revenueCurrent / filteredRevenueTotal) * 100, 1) : 0,
        shareRevenuePreviousPct: filteredRevenuePrevious > 0 ? round((revenuePrevious / filteredRevenuePrevious) * 100, 1) : 0,
        trend
      } satisfies DashboardProductMomentumItem;
    })
    .filter((item) => item.qtyCurrent > 0 || item.qtyPrevious > 0 || item.revenueCurrent > 0 || item.revenuePrevious > 0)
    .sort((a, b) => {
      const revenueDeltaAbsA = Math.abs(a.revenueCurrent - a.revenuePrevious);
      const revenueDeltaAbsB = Math.abs(b.revenueCurrent - b.revenuePrevious);
      if (revenueDeltaAbsB !== revenueDeltaAbsA) {
        return revenueDeltaAbsB - revenueDeltaAbsA;
      }

      return b.revenueCurrent - a.revenueCurrent;
    })
    .slice(0, 8);

  const risingMomentumProducts = productMomentum.filter((item) => item.trend === "rising");
  const decliningMomentumProducts = productMomentum.filter((item) => item.trend === "declining");

  const filteredHourlyBuckets: DashboardHourlyPoint[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: toHourLabel(hour),
    transactions: 0,
    revenue: 0
  }));

  for (const sale of filteredTrendSales) {
    const saleDate = new Date(sale.created_at);
    const hour = saleDate.getHours();
    const bucket = filteredHourlyBuckets[hour];
    bucket.transactions += 1;
    bucket.revenue += toNumber(sale.total);
  }

  const todayFilteredSales = todaySales.filter(isSaleMatchedByFilter);
  const historicalFilteredSales = salesRows.filter((row) => {
    const saleDate = new Date(row.created_at);
    return isWithinRange(saleDate, startOfPreviousTrendWindow, startOfDay) && isSaleMatchedByFilter(row);
  });

  const baselineDayKeys = new Set(historicalFilteredSales.map((row) => toDateKey(new Date(row.created_at))));
  const baselineDays = baselineDayKeys.size;

  const todayHourlyRevenue = Array.from({ length: 24 }, () => 0);
  const todayHourlyTransactions = Array.from({ length: 24 }, () => 0);
  const baselineHourlyRevenueTotal = Array.from({ length: 24 }, () => 0);
  const baselineHourlyTransactionsTotal = Array.from({ length: 24 }, () => 0);

  for (const sale of todayFilteredSales) {
    const saleDate = new Date(sale.created_at);
    const hour = saleDate.getHours();
    todayHourlyRevenue[hour] += toNumber(sale.total);
    todayHourlyTransactions[hour] += 1;
  }

  for (const sale of historicalFilteredSales) {
    const saleDate = new Date(sale.created_at);
    const hour = saleDate.getHours();
    baselineHourlyRevenueTotal[hour] += toNumber(sale.total);
    baselineHourlyTransactionsTotal[hour] += 1;
  }

  let stableHours = 0;
  let alertHours = 0;
  let opportunityHours = 0;
  let activeHours = 0;

  const anomalyCandidates: DashboardHourlyAnomalyItem[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    const todayRevenueAtHour = todayHourlyRevenue[hour];
    const todayTransactionsAtHour = todayHourlyTransactions[hour];
    const baselineRevenueAtHour = baselineDays > 0 ? baselineHourlyRevenueTotal[hour] / baselineDays : 0;
    const baselineTransactionsAtHour = baselineDays > 0 ? baselineHourlyTransactionsTotal[hour] / baselineDays : 0;

    if (
      todayRevenueAtHour <= 0
      && todayTransactionsAtHour <= 0
      && baselineRevenueAtHour <= 0
      && baselineTransactionsAtHour <= 0
    ) {
      continue;
    }

    activeHours += 1;

    const deviationPct = clampPercent(calcDeltaPct(todayRevenueAtHour, baselineRevenueAtHour));
    const revenueRatio = baselineRevenueAtHour > 0 ? todayRevenueAtHour / baselineRevenueAtHour : 1;
    let level: DashboardAnomalyLevel | null = null;

    if (baselineRevenueAtHour <= 0 && todayRevenueAtHour > 0) {
      level = "opportunity";
    } else if (baselineRevenueAtHour > 0 && todayRevenueAtHour <= 0) {
      level = "alert";
    } else if (revenueRatio <= 0.55 || deviationPct <= -35) {
      level = "alert";
    } else if (revenueRatio >= 1.45 || deviationPct >= 35) {
      level = "opportunity";
    } else if (Math.abs(deviationPct) >= 18) {
      level = "watch";
    }

    if (!level) {
      stableHours += 1;
      continue;
    }

    if (level === "alert") {
      alertHours += 1;
    } else if (level === "opportunity") {
      opportunityHours += 1;
    }

    const hourLabel = toHourLabel(hour);
    const roundedDeviation = round(deviationPct, 1);

    let action = `Pantau eksekusi operasional di jam ${hourLabel} karena deviasi masih moderat.`;
    if (level === "alert") {
      action = `Jam ${hourLabel} tertinggal dari baseline. Dorong traffic cepat dengan promo ringan dan cek kesiapan tim.`;
    } else if (level === "opportunity") {
      action = `Jam ${hourLabel} sedang kuat. Maksimalkan upsell dan percepat checkout untuk menangkap momentum.`;
    }

    anomalyCandidates.push({
      hour,
      label: hourLabel,
      todayRevenue: round(todayRevenueAtHour, 0),
      baselineRevenue: round(baselineRevenueAtHour, 0),
      todayTransactions: todayTransactionsAtHour,
      baselineTransactions: round(baselineTransactionsAtHour, 1),
      deviationPct: roundedDeviation,
      level,
      action
    } satisfies DashboardHourlyAnomalyItem);
  }

  const notableAnomalyHours = anomalyCandidates
    .slice()
    .sort((a, b) => {
      const levelWeight = (level: DashboardAnomalyLevel) => {
        if (level === "alert") return 3;
        if (level === "opportunity") return 2;
        return 1;
      };

      const severityA = levelWeight(a.level) * 1000 + Math.abs(a.deviationPct);
      const severityB = levelWeight(b.level) * 1000 + Math.abs(b.deviationPct);
      return severityB - severityA;
    })
    .slice(0, 6);

  const stableHoursPct = activeHours > 0 ? round((stableHours / activeHours) * 100, 1) : 100;

  let anomalySummary = "Belum ada aktivitas per jam pada kombinasi filter saat ini.";
  if (activeHours > 0) {
    if (alertHours >= 2) {
      anomalySummary = `Terdeteksi ${alertHours} jam kritis yang butuh intervensi cepat untuk mencegah gap omzet harian.`;
    } else if (opportunityHours >= 2) {
      anomalySummary = `Ada ${opportunityHours} jam peluang yang bisa ditingkatkan untuk memperbesar omzet hari ini.`;
    } else if (notableAnomalyHours.length === 0) {
      anomalySummary = `Performa jam relatif stabil, ${stableHoursPct.toFixed(1)}% jam berada dalam rentang normal.`;
    } else {
      anomalySummary = "Terdapat deviasi moderat pada beberapa jam, lakukan monitoring dan optimasi ringan.";
    }
  }

  const anomalyRadar: DashboardAnomalyRadar = {
    baselineDays,
    stableHoursPct,
    alertHours,
    opportunityHours,
    notableHours: notableAnomalyHours,
    summary: anomalySummary
  };

  const filteredBestHour = filteredHourlyBuckets.reduce((best, point) =>
    point.revenue > best.revenue ? point : best
  , filteredHourlyBuckets[0]);

  const filteredPeakHourLabel = filteredBestHour.transactions > 0
    ? `${filteredBestHour.label} (${filteredBestHour.transactions} trx)`
    : "Belum ada transaksi pada filter";

  const filteredSnapshotLabel = `${SOURCE_FILTER_LABELS[sourceFilter]} · ${DAY_TYPE_FILTER_LABELS[dayTypeFilter]}`;
  const filteredProjectedMonthlyRevenue = periodDays > 0 ? (filteredRevenueTotal / periodDays) * 30 : 0;

  const filteredDailyBreakdown: DashboardFilteredDailyPoint[] = Array.from({ length: periodDays }, (_, index) => {
    const date = new Date(startOfTrendWindow);
    date.setDate(startOfTrendWindow.getDate() + index);
    const dateKey = toDateKey(date);

    const matchingRows = filteredTrendSales.filter((row) => toDateKey(new Date(row.created_at)) === dateKey);
    const revenue = matchingRows.reduce((sum, row) => sum + toNumber(row.total), 0);
    const transactions = matchingRows.length;

    return {
      date: dateKey,
      label: date.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit" }),
      revenue,
      transactions,
      averageTicket: transactions > 0 ? round(revenue / transactions, 0) : 0
    } satisfies DashboardFilteredDailyPoint;
  });

  const filteredBestDay = filteredDailyBreakdown.reduce((best, point) =>
    point.revenue > best.revenue ? point : best
  , filteredDailyBreakdown[0]);

  const filteredWorstDay = filteredDailyBreakdown.reduce((worst, point) => {
    if (point.transactions === 0) return worst;
    if (worst.transactions === 0) return point;
    return point.revenue < worst.revenue ? point : worst;
  }, filteredDailyBreakdown[0]);

  const filteredBestDayLabel = filteredBestDay.revenue > 0
    ? `${filteredBestDay.label} (${filteredBestDay.transactions} trx)`
    : "Belum ada hari terkuat";

  const filteredWorstDayLabel = filteredWorstDay.transactions > 0
    ? `${filteredWorstDay.label} (${filteredWorstDay.transactions} trx)`
    : "Belum ada hari terlemah";

  const monthSales = salesRows.filter((row) => {
    const saleDate = new Date(row.created_at);
    return isWithinRange(saleDate, startOfMonth, startOfNextMonth);
  });

  const monthToDateRevenue = monthSales.reduce((sum, row) => sum + toNumber(row.total), 0);
  const monthToDateTransactions = monthSales.length;
  const totalDaysInMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).getDate();
  const elapsedDaysInMonth = Math.max(1, Math.min(totalDaysInMonth, startOfDay.getDate()));
  const remainingDaysInMonth = Math.max(0, totalDaysInMonth - elapsedDaysInMonth);
  const timeProgressPct = round((elapsedDaysInMonth / totalDaysInMonth) * 100, 1);
  const monthToDateDailyAverage = elapsedDaysInMonth > 0 ? monthToDateRevenue / elapsedDaysInMonth : 0;
  const projectedMonthEndRevenue = monthToDateDailyAverage * totalDaysInMonth;
  const targetProgressPct = monthlyTarget > 0
    ? round((monthToDateRevenue / monthlyTarget) * 100, 1)
    : 0;
  const targetGap = monthlyTarget > 0 ? monthlyTarget - monthToDateRevenue : 0;
  const requiredDailyRevenueForTarget = monthlyTarget > 0 && remainingDaysInMonth > 0
    ? Math.max(0, targetGap) / remainingDaysInMonth
    : 0;

  let monthlyTargetStatus: DashboardMonthlyTargetStatus = "no-target";
  if (monthlyTarget > 0) {
    const projectedRatio = projectedMonthEndRevenue / monthlyTarget;
    if (projectedRatio >= 1) {
      monthlyTargetStatus = "on-track";
    } else if (projectedRatio >= 0.9) {
      monthlyTargetStatus = "at-risk";
    } else {
      monthlyTargetStatus = "behind";
    }
  }

  const monthlyTargetTracker: DashboardMonthlyTargetTracker = {
    monthlyTarget,
    monthToDateRevenue,
    monthToDateTransactions,
    elapsedDaysInMonth,
    totalDaysInMonth,
    remainingDaysInMonth,
    targetProgressPct,
    timeProgressPct,
    projectedMonthEndRevenue,
    requiredDailyRevenueForTarget,
    targetGap,
    status: monthlyTargetStatus
  };

  const baselineDailyRevenue = periodDays > 0 ? filteredRevenueTotal / periodDays : 0;
  const baselineTransactionsPerDay = periodDays > 0 ? filteredTransactionsTotal / periodDays : 0;
  const baselineAverageTicket = filteredAverageTicket > 0
    ? filteredAverageTicket
    : trendTransactionsTotal > 0
      ? trendRevenueTotal / trendTransactionsTotal
      : 0;

  const requiredDailyRevenue = monthlyTarget > 0 ? requiredDailyRevenueForTarget : 0;
  const dailyRevenueGap = Math.max(0, requiredDailyRevenue - baselineDailyRevenue);
  const requiredTransactionsPerDay = requiredDailyRevenue > 0 && baselineAverageTicket > 0
    ? requiredDailyRevenue / baselineAverageTicket
    : 0;
  const requiredAverageTicket = requiredDailyRevenue > 0 && baselineTransactionsPerDay > 0
    ? requiredDailyRevenue / baselineTransactionsPerDay
    : 0;

  const transactionsLiftPct = requiredTransactionsPerDay > 0 && baselineTransactionsPerDay > 0
    ? clampPercent(calcDeltaPct(requiredTransactionsPerDay, baselineTransactionsPerDay))
    : requiredTransactionsPerDay > 0
      ? 100
      : 0;

  const averageTicketLiftPct = requiredAverageTicket > 0 && baselineAverageTicket > 0
    ? clampPercent(calcDeltaPct(requiredAverageTicket, baselineAverageTicket))
    : 0;

  const sourceFocusPool = sourceMomentum
    .filter((item) => item.transactionsCurrent > 0)
    .sort((a, b) => {
      if (b.revenueDeltaPct !== a.revenueDeltaPct) {
        return b.revenueDeltaPct - a.revenueDeltaPct;
      }

      return b.shareRevenueCurrentPct - a.shareRevenueCurrentPct;
    });

  const recommendedFocusSources = sourceFocusPool
    .slice(0, 2)
    .map((item) => `${item.label} (${item.shareRevenueCurrentPct.toFixed(1)}%)`);

  const activeFilteredHours = filteredHourlyBuckets.filter((point) => point.transactions > 0);

  const recommendedPeakHours = activeFilteredHours
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .map((point) => `${point.label} (${point.transactions} trx)`);

  const recommendedSlowHours = activeFilteredHours
    .slice()
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 2)
    .map((point) => `${point.label} (${point.transactions} trx)`);

  let executionPlannerStatus: DashboardExecutionPlannerStatus = "off";
  if (monthlyTarget > 0) {
    if (dailyRevenueGap <= 0) {
      executionPlannerStatus = "on-track";
    } else if (transactionsLiftPct <= 20 || averageTicketLiftPct <= 12) {
      executionPlannerStatus = "needs-push";
    } else {
      executionPlannerStatus = "critical";
    }
  }

  let executionPlannerPrimaryAction = "Isi target bulanan pada filter agar planner bisa memberi estimasi kebutuhan harian.";
  let executionPlannerSecondaryAction = "Set target, lalu review source dan jam fokus untuk mengeksekusi plan harian.";

  if (executionPlannerStatus === "on-track") {
    const peakHoursLabel = recommendedPeakHours.length > 0
      ? recommendedPeakHours.join(", ")
      : filteredPeakHourLabel;
    executionPlannerPrimaryAction = `Target saat ini aman, pertahankan fokus performa di jam ${peakHoursLabel}.`;
    executionPlannerSecondaryAction = "Gunakan momentum saat ini untuk menambah buffer omzet sebelum akhir bulan.";
  } else if (executionPlannerStatus === "needs-push") {
    const sourceLabel = recommendedFocusSources[0] ?? "kanal terkuat";
    executionPlannerPrimaryAction = `Dorong pertumbuhan ringan lewat kanal ${sourceLabel} dengan promosi taktikal harian.`;
    executionPlannerSecondaryAction = "Optimalkan jam sepi dengan bundling ringan agar gap target tertutup tanpa diskon agresif.";
  } else if (executionPlannerStatus === "critical") {
    const slowHoursLabel = recommendedSlowHours.length > 0
      ? recommendedSlowHours.join(", ")
      : "jam beromzet rendah";
    executionPlannerPrimaryAction = `Gap target tinggi, jalankan campaign recovery fokus di ${slowHoursLabel} mulai hari ini.`;
    executionPlannerSecondaryAction = "Percepat intervensi pricing, bundling, dan staffing untuk memperbaiki traffic serta average ticket.";
  }

  const executionPlanner: DashboardExecutionPlanner = {
    status: executionPlannerStatus,
    baselineDailyRevenue: round(baselineDailyRevenue, 0),
    requiredDailyRevenue: round(requiredDailyRevenue, 0),
    dailyRevenueGap: round(dailyRevenueGap, 0),
    baselineTransactionsPerDay: round(baselineTransactionsPerDay, 1),
    requiredTransactionsPerDay: round(requiredTransactionsPerDay, 1),
    transactionsLiftPct: round(transactionsLiftPct, 1),
    baselineAverageTicket: round(baselineAverageTicket, 0),
    requiredAverageTicket: round(requiredAverageTicket, 0),
    averageTicketLiftPct: round(averageTicketLiftPct, 1),
    recommendedFocusSources,
    recommendedPeakHours,
    recommendedSlowHours,
    primaryAction: executionPlannerPrimaryAction,
    secondaryAction: executionPlannerSecondaryAction
  };

  const filteredTodayRevenue = todayFilteredSales.reduce((sum, sale) => sum + toNumber(sale.total), 0);
  const filteredTodayTransactions = todayFilteredSales.length;
  const filteredTodayAverageTicket = filteredTodayTransactions > 0
    ? filteredTodayRevenue / filteredTodayTransactions
    : 0;

  const usingDefaultLens = sourceFilter === "all" && dayTypeFilter === "all";
  const filteredRevenueShare = trendRevenueTotal > 0 ? filteredRevenueTotal / trendRevenueTotal : 0;

  const missionRequiredRevenueRaw = monthlyTarget > 0
    ? usingDefaultLens
      ? requiredDailyRevenueForTarget
      : requiredDailyRevenueForTarget * filteredRevenueShare
    : 0;

  const missionReferenceAverageTicket = baselineAverageTicket > 0
    ? baselineAverageTicket
    : filteredTodayAverageTicket > 0
      ? filteredTodayAverageTicket
      : averageTicketToday;

  const missionRequiredTransactionsRaw = missionRequiredRevenueRaw > 0 && missionReferenceAverageTicket > 0
    ? missionRequiredRevenueRaw / missionReferenceAverageTicket
    : 0;

  const missionRequiredAverageTicketRaw = missionRequiredRevenueRaw > 0 && missionRequiredTransactionsRaw > 0
    ? missionRequiredRevenueRaw / missionRequiredTransactionsRaw
    : missionReferenceAverageTicket;

  const missionRevenueProgressPct = missionRequiredRevenueRaw > 0
    ? round((filteredTodayRevenue / missionRequiredRevenueRaw) * 100, 1)
    : 0;

  const missionTransactionsProgressPct = missionRequiredTransactionsRaw > 0
    ? round((filteredTodayTransactions / missionRequiredTransactionsRaw) * 100, 1)
    : 0;

  const missionAverageTicketProgressPct = missionRequiredAverageTicketRaw > 0
    ? round((filteredTodayAverageTicket / missionRequiredAverageTicketRaw) * 100, 1)
    : 0;

  const missionRevenueGap = Math.max(0, missionRequiredRevenueRaw - filteredTodayRevenue);
  const missionTransactionGap = Math.max(0, missionRequiredTransactionsRaw - filteredTodayTransactions);

  let dailyMissionStatus: DashboardDailyMissionStatus = "off";
  if (missionRequiredRevenueRaw > 0) {
    if (missionRevenueProgressPct >= 115 && missionTransactionsProgressPct >= 105) {
      dailyMissionStatus = "ahead";
    } else if (missionRevenueProgressPct >= 90) {
      dailyMissionStatus = "on-track";
    } else {
      dailyMissionStatus = "behind";
    }
  }

  const dailyMissionLabel = usingDefaultLens
    ? "Misi Harian Global"
    : `Misi Harian (${filteredSnapshotLabel})`;

  let dailyMissionFocusMessage = "Isi target bulanan untuk mengaktifkan misi harian dan kebutuhan eksekusi harian.";
  const dailyMissionActions: string[] = [];

  if (dailyMissionStatus === "ahead") {
    dailyMissionFocusMessage = "Performa hari ini melampaui kebutuhan target harian. Pertahankan quality service dan bangun buffer omzet.";
    dailyMissionActions.push("Pertahankan jam ramai dengan cashier throughput tinggi.");
    dailyMissionActions.push("Alihkan sebagian effort ke upsell agar margin harian tetap sehat.");
    dailyMissionActions.push("Simpan buffer untuk mengompensasi potensi hari lemah berikutnya.");
  } else if (dailyMissionStatus === "on-track") {
    dailyMissionFocusMessage = "Progress harian mendekati jalur target. Butuh dorongan ringan agar finish tetap aman.";
    dailyMissionActions.push("Aktifkan promo taktikal pada jam recovery.");
    dailyMissionActions.push("Jaga average ticket lewat bundling add-on bernilai tinggi.");
    dailyMissionActions.push("Monitor transaksi per jam untuk mencegah drop mendadak.");
  } else if (dailyMissionStatus === "behind") {
    dailyMissionFocusMessage = "Misi harian tertinggal dari kebutuhan target. Fokus percepatan traffic dan perbaikan checkout sekarang.";
    dailyMissionActions.push("Dorong traffic cepat dengan kampanye short-burst di kanal utama.");
    dailyMissionActions.push("Optimalkan jam sepi dengan offer khusus durasi terbatas.");
    dailyMissionActions.push("Pantau konversi kasir untuk mengurangi antrean dan lost basket.");
  }

  if (!usingDefaultLens && monthlyTarget > 0) {
    dailyMissionActions.unshift("Lens ini menunjukkan kontribusi kanal/hari terhadap misi target bulanan.");
  }

  const dailyMission: DashboardDailyMission = {
    status: dailyMissionStatus,
    label: dailyMissionLabel,
    requiredRevenue: round(missionRequiredRevenueRaw, 0),
    achievedRevenue: round(filteredTodayRevenue, 0),
    revenueProgressPct: missionRevenueProgressPct,
    revenueGap: round(missionRevenueGap, 0),
    requiredTransactions: round(missionRequiredTransactionsRaw, 1),
    achievedTransactions: filteredTodayTransactions,
    transactionsProgressPct: missionTransactionsProgressPct,
    transactionGap: round(missionTransactionGap, 1),
    requiredAverageTicket: round(missionRequiredAverageTicketRaw, 0),
    achievedAverageTicket: round(filteredTodayAverageTicket, 0),
    averageTicketProgressPct: missionAverageTicketProgressPct,
    focusMessage: dailyMissionFocusMessage,
    nextActions: dailyMissionActions.slice(0, 3)
  };

  const activeDailyRevenue = filteredDailyBreakdown
    .map((point) => point.revenue)
    .filter((revenue) => revenue > 0);

  const meanDailyRevenue = activeDailyRevenue.length > 0
    ? activeDailyRevenue.reduce((sum, revenue) => sum + revenue, 0) / activeDailyRevenue.length
    : baselineDailyRevenue;

  const varianceDailyRevenue = activeDailyRevenue.length > 1 && meanDailyRevenue > 0
    ? activeDailyRevenue.reduce((sum, revenue) => sum + Math.pow(revenue - meanDailyRevenue, 2), 0) / activeDailyRevenue.length
    : 0;

  const stdDailyRevenue = Math.sqrt(Math.max(0, varianceDailyRevenue));
  const volatilityPct = meanDailyRevenue > 0
    ? round((stdDailyRevenue / meanDailyRevenue) * 100, 1)
    : 0;

  const scenarioVolatilityFactor = Math.max(0.05, Math.min(0.35, volatilityPct / 100));
  const targetScenarioDefinitions: Array<{
    level: DashboardTargetScenarioLevel;
    label: string;
    multiplier: number;
    baseProbability: number;
  }> = [
    {
      level: "conservative",
      label: "Conservative",
      multiplier: Math.max(0.7, 1 - scenarioVolatilityFactor * 0.55),
      baseProbability: 78
    },
    {
      level: "baseline",
      label: "Baseline",
      multiplier: 1,
      baseProbability: 62
    },
    {
      level: "stretch",
      label: "Stretch",
      multiplier: 1 + Math.max(0.08, scenarioVolatilityFactor * 0.9),
      baseProbability: 38
    }
  ];

  const targetScenarioItems: DashboardTargetScenarioItem[] = targetScenarioDefinitions.map((scenario) => {
    const projectedDailyRevenue = baselineDailyRevenue * scenario.multiplier;
    const projectedMonthEndRevenue = monthToDateRevenue + (projectedDailyRevenue * remainingDaysInMonth);
    const targetGap = monthlyTarget > 0 ? monthlyTarget - projectedMonthEndRevenue : 0;
    const projectedProgressPct = monthlyTarget > 0
      ? round((projectedMonthEndRevenue / monthlyTarget) * 100, 1)
      : 0;
    const requiredDailyRevenue = monthlyTarget > 0 && remainingDaysInMonth > 0
      ? Math.max(0, targetGap) / remainingDaysInMonth
      : 0;

    const requiredTransactionsPerDay = requiredDailyRevenue > 0 && baselineAverageTicket > 0
      ? requiredDailyRevenue / baselineAverageTicket
      : 0;
    const requiredAverageTicket = requiredDailyRevenue > 0 && baselineTransactionsPerDay > 0
      ? requiredDailyRevenue / baselineTransactionsPerDay
      : 0;

    let winProbabilityPct = scenario.baseProbability - (volatilityPct * 0.35);
    if (monthlyTarget > 0) {
      const targetCoverageRatio = projectedMonthEndRevenue / monthlyTarget;
      if (targetCoverageRatio >= 1) {
        winProbabilityPct += 18;
      } else if (targetCoverageRatio >= 0.95) {
        winProbabilityPct += 8;
      } else if (targetCoverageRatio >= 0.85) {
        winProbabilityPct -= 6;
      } else {
        winProbabilityPct -= 14;
      }
    } else {
      winProbabilityPct += 5;
    }

    winProbabilityPct = Math.max(5, Math.min(95, winProbabilityPct));

    let action = "Tetapkan target bulanan agar simulator dapat mengukur peluang capai target lebih akurat.";
    if (monthlyTarget > 0) {
      if (scenario.level === "conservative") {
        action = targetGap <= 0
          ? "Skenario aman. Prioritaskan efisiensi biaya dan jaga margin agar surplus tetap terjaga."
          : "Skenario aman namun belum menutup target. Fokus stabilkan operasional sambil menambah traffic organik.";
      } else if (scenario.level === "baseline") {
        action = targetGap <= 0
          ? "Skenario realistis sudah menutup target. Pertahankan ritme promo ringan dan kualitas layanan."
          : "Skenario realistis masih ada gap. Dorong transaksi harian lewat campaign rutin dan optimasi jam sepi.";
      } else {
        action = targetGap <= 0
          ? "Skenario agresif berpotensi memberi buffer besar. Siapkan kapasitas tim dan stok agar momentum tidak hilang."
          : "Skenario agresif dibutuhkan untuk menutup target. Kombinasikan push traffic, upsell, dan perbaikan checkout speed.";
      }
    }

    return {
      level: scenario.level,
      label: scenario.label,
      projectedMonthEndRevenue: round(projectedMonthEndRevenue, 0),
      targetGap: round(targetGap, 0),
      projectedProgressPct,
      requiredDailyRevenue: round(requiredDailyRevenue, 0),
      requiredTransactionsPerDay: round(requiredTransactionsPerDay, 1),
      requiredAverageTicket: round(requiredAverageTicket, 0),
      winProbabilityPct: round(winProbabilityPct, 1),
      action
    } satisfies DashboardTargetScenarioItem;
  });

  const targetScenarioSimulator: DashboardTargetScenarioSimulator = {
    baselineDailyRevenue: round(baselineDailyRevenue, 0),
    baselineTransactionsPerDay: round(baselineTransactionsPerDay, 1),
    baselineAverageTicket: round(baselineAverageTicket, 0),
    volatilityPct,
    scenarios: targetScenarioItems
  };

  const consistencyReferenceDailyRevenue = baselineDailyRevenue > 0 ? baselineDailyRevenue : meanDailyRevenue;
  const consistencyStrongThreshold = consistencyReferenceDailyRevenue > 0 ? consistencyReferenceDailyRevenue * 0.9 : 0;
  const consistencyWeakThreshold = consistencyReferenceDailyRevenue > 0 ? consistencyReferenceDailyRevenue * 0.6 : 0;

  let zeroSalesDays = 0;
  let activeSalesDays = 0;
  let bestStreakDays = 0;
  let weakStreakDays = 0;
  let currentStrongStreak = 0;
  let currentWeakStreak = 0;

  for (const point of filteredDailyBreakdown) {
    const hasSales = point.transactions > 0;

    if (!hasSales) {
      zeroSalesDays += 1;
    } else {
      activeSalesDays += 1;
    }

    const isStrong = hasSales && consistencyStrongThreshold > 0 && point.revenue >= consistencyStrongThreshold;
    const isWeak = !hasSales || (consistencyWeakThreshold > 0 && point.revenue <= consistencyWeakThreshold);

    if (isStrong) {
      currentStrongStreak += 1;
      if (currentStrongStreak > bestStreakDays) {
        bestStreakDays = currentStrongStreak;
      }
    } else {
      currentStrongStreak = 0;
    }

    if (isWeak) {
      currentWeakStreak += 1;
      if (currentWeakStreak > weakStreakDays) {
        weakStreakDays = currentWeakStreak;
      }
    } else {
      currentWeakStreak = 0;
    }
  }

  const activeDaysPct = periodDays > 0 ? round((activeSalesDays / periodDays) * 100, 1) : 0;

  const consistencyScoreRaw = 100
    - Math.min(45, volatilityPct * 1.15)
    - (zeroSalesDays * 8)
    - (weakStreakDays * 5)
    + Math.min(12, bestStreakDays * 2);

  const consistencyScore = Math.max(0, Math.min(100, Math.round(consistencyScoreRaw)));

  let consistencyState: DashboardConsistencyState = "fragile";
  if (consistencyScore >= 75) {
    consistencyState = "stable";
  } else if (consistencyScore >= 50) {
    consistencyState = "volatile";
  }

  let consistencyRecommendation = "Performa harian belum stabil, prioritaskan ritme traffic dan kontrol operasional per jam.";
  if (consistencyState === "stable") {
    consistencyRecommendation = "Performa cenderung konsisten. Fokus menjaga eksekusi agar streak positif tetap panjang.";
  } else if (consistencyState === "volatile") {
    consistencyRecommendation = "Performa mulai fluktuatif. Stabilkan demand di hari lemah lewat promo terukur dan staffing adaptif.";
  }

  const consistencyRadar: DashboardConsistencyRadar = {
    state: consistencyState,
    score: consistencyScore,
    volatilityPct,
    activeDays: activeSalesDays,
    activeDaysPct,
    zeroSalesDays,
    bestStreakDays,
    weakStreakDays,
    recommendation: consistencyRecommendation
  };

  const weekRevenue = Array.from({ length: periodDays }, (_, index) => {
    const date = new Date(startOfTrendWindow);
    date.setDate(startOfTrendWindow.getDate() + index);
    const dateKey = toDateKey(date);

    const matchingRows = trendSales.filter((row) => toDateKey(new Date(row.created_at)) === dateKey);
    const revenue = matchingRows.reduce((sum, row) => sum + toNumber(row.total), 0);

    return {
      date: dateKey,
      label: date.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit" }),
      revenue,
      transactions: matchingRows.length
    } satisfies DashboardTrendPoint;
  });

  const trendPeakDay = weekRevenue.reduce((peak, point) =>
    point.revenue > peak.revenue ? point : peak
  , weekRevenue[0]);
  const trendPeakDayLabel = trendPeakDay.revenue > 0
    ? trendPeakDay.label
    : "Belum ada puncak penjualan";

  const recentSales = salesRows.slice(0, 8).map((row) => ({
    id: row.id,
    total: toNumber(row.total),
    createdAt: row.created_at,
    source: normalizeSource(row.source)
  } satisfies DashboardRecentSale));

  const sourceSummaryMap = new Map<string, { transactions: number; revenue: number }>();
  for (const sale of todaySales) {
    const source = normalizeSource(sale.source);
    const current = sourceSummaryMap.get(source) ?? { transactions: 0, revenue: 0 };
    current.transactions += 1;
    current.revenue += toNumber(sale.total);
    sourceSummaryMap.set(source, current);
  }

  const sourceMix = Array.from(sourceSummaryMap.entries())
    .map(([source, value]) => ({
      source,
      transactions: value.transactions,
      revenue: value.revenue,
      shareTransactionsPct: todayTransactions > 0 ? round((value.transactions / todayTransactions) * 100, 1) : 0,
      shareRevenuePct: todayRevenue > 0 ? round((value.revenue / todayRevenue) * 100, 1) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const dominantSource = sourceMix[0];

  const dayTypeBuckets: Record<"weekday" | "weekend", { label: string; revenue: number; transactions: number }> = {
    weekday: {
      label: "Hari Kerja",
      revenue: 0,
      transactions: 0
    },
    weekend: {
      label: "Akhir Pekan",
      revenue: 0,
      transactions: 0
    }
  };

  for (const sale of trendSales) {
    const saleDate = new Date(sale.created_at);
    const bucketKey = isWeekendDay(saleDate) ? "weekend" : "weekday";
    dayTypeBuckets[bucketKey].transactions += 1;
    dayTypeBuckets[bucketKey].revenue += toNumber(sale.total);
  }

  const dayTypeMix: DashboardDayTypePoint[] = (["weekday", "weekend"] as const).map((dayType) => {
    const bucket = dayTypeBuckets[dayType];
    return {
      dayType,
      label: bucket.label,
      revenue: bucket.revenue,
      transactions: bucket.transactions,
      averageTicket: bucket.transactions > 0 ? round(bucket.revenue / bucket.transactions, 0) : 0,
      shareRevenuePct: trendRevenueTotal > 0 ? round((bucket.revenue / trendRevenueTotal) * 100, 1) : 0
    };
  });

  const topProductMap = new Map<string, DashboardTopProduct>();
  for (const sale of todaySales) {
    const parsedItems = parseSaleLineItems(sale.line_items);
    for (const item of parsedItems) {
      const current = topProductMap.get(item.productId);
      if (!current) {
        topProductMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          qty: item.qty,
          gross: item.gross
        });
        continue;
      }

      current.qty += item.qty;
      current.gross += item.gross;
    }
  }

  const topProducts = Array.from(topProductMap.values())
    .sort((a, b) => b.qty - a.qty || b.gross - a.gross)
    .slice(0, 5);

  const hourlySales: DashboardHourlyPoint[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: toHourLabel(hour),
    transactions: 0,
    revenue: 0
  }));

  for (const sale of todaySales) {
    const saleDate = new Date(sale.created_at);
    const hour = saleDate.getHours();
    const bucket = hourlySales[hour];
    bucket.transactions += 1;
    bucket.revenue += toNumber(sale.total);
  }

  const bestHour = hourlySales.reduce((best, point) =>
    point.revenue > best.revenue ? point : best
  , hourlySales[0]);
  const bestHourLabel = bestHour.transactions > 0
    ? `${bestHour.label} (${bestHour.transactions} trx)`
    : "Belum ada transaksi";

  const activeProducts = productsResult.count ?? 0;

  let activeCashiers = 0;
  let activeManagers = 0;

  if (!profilesResult.error) {
    const profileRows = (profilesResult.data ?? []) as RawProfileWithStatus[];
    activeCashiers = profileRows.filter((row) => row.role === "cashier" && row.is_active).length;
    activeManagers = profileRows.filter((row) => row.role === "manager" && row.is_active).length;
  } else {
    const fallbackProfilesResult = await supabase
      .from("profiles")
      .select("role")
      .eq("tenant_id", tenantId)
      .in("role", ["cashier", "manager"]);

    if (!fallbackProfilesResult.error) {
      const profileRows = (fallbackProfilesResult.data ?? []) as RawProfileFallback[];
      activeCashiers = profileRows.filter((row) => row.role === "cashier").length;
      activeManagers = profileRows.filter((row) => row.role === "manager").length;
    }
  }

  const subscriptionStatus = subscriptionResult.data?.status ?? "unknown";
  const pendingSync = pendingResult.count ?? 0;

  const alerts: DashboardAlert[] = [];

  if (subscriptionStatus === "past_due") {
    alerts.push({
      level: "critical",
      title: "Subscription Menunggak",
      detail: "Perlu tindakan pembayaran agar layanan tidak terganggu."
    });
  }

  if (subscriptionStatus === "canceled") {
    alerts.push({
      level: "critical",
      title: "Subscription Nonaktif",
      detail: "Aktifkan kembali paket agar sinkronisasi dan layanan cloud tetap berjalan."
    });
  }

  if (pendingSync > 20) {
    alerts.push({
      level: "warning",
      title: "Transaksi POS Tinggi Hari Ini",
      detail: "Volume transaksi source POS sangat tinggi, pastikan monitoring sinkronisasi tetap stabil."
    });
  }

  if (todayTransactions === 0) {
    alerts.push({
      level: "warning",
      title: "Belum Ada Transaksi Hari Ini",
      detail: "Periksa status outlet dan perangkat kasir untuk memastikan operasional berjalan."
    });
  }

  if (yesterdayRevenue > 0 && revenueDeltaPct <= -20) {
    alerts.push({
      level: "warning",
      title: "Omzet Turun Signifikan",
      detail: `Omzet hari ini turun ${Math.abs(Math.round(revenueDeltaPct))}% dibanding kemarin.`
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "info",
      title: "Operasional Stabil",
      detail: "Tidak ada anomali besar yang terdeteksi dari ringkasan data hari ini."
    });
  }

  const criticalAlerts = alerts.filter((alert) => alert.level === "critical").length;
  const warningAlerts = alerts.filter((alert) => alert.level === "warning").length;
  const activeTeam = activeCashiers + activeManagers;

  let healthScore = 68;
  healthScore += Math.max(-20, Math.min(20, revenueDeltaPct * 0.6));
  healthScore += Math.max(-15, Math.min(15, transactionsDeltaPct * 0.5));
  healthScore += Math.max(-10, Math.min(10, averageTicketDeltaPct * 0.4));
  healthScore += Math.max(-15, Math.min(15, trendRevenueDeltaPct * 0.35));
  healthScore -= criticalAlerts * 18;
  healthScore -= warningAlerts * 8;

  if (activeTeam === 0) {
    healthScore -= 12;
  }

  if (todayTransactions === 0) {
    healthScore -= 8;
  }

  if (monthlyTargetStatus === "behind") {
    healthScore -= 10;
  } else if (monthlyTargetStatus === "at-risk") {
    healthScore -= 4;
  }

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  let healthLabel: DashboardHealthLabel = "Critical";
  if (healthScore >= 85) {
    healthLabel = "Excellent";
  } else if (healthScore >= 70) {
    healthLabel = "Good";
  } else if (healthScore >= 50) {
    healthLabel = "Watch";
  }

  const healthFocus: string[] = [];

  if (trendRevenueDeltaPct <= -12) {
    healthFocus.push(`Pulihkan omzet periode ${periodDays} hari dengan promo jam sepi dan reaktivasi pelanggan lama.`);
  }

  if (averageTicketDeltaPct <= -10) {
    healthFocus.push("Dorong upsell di kasir dengan bundling dan add-on agar nilai ticket naik.");
  }

  if (dominantSource && dominantSource.shareTransactionsPct >= 85) {
    healthFocus.push("Kurangi ketergantungan kanal dominan dengan campaign kanal alternatif.");
  }

  if (pendingSync > 20) {
    healthFocus.push("Perketat monitoring sinkronisasi POS karena volume transaksi source POS tinggi.");
  }

  if (activeTeam === 0) {
    healthFocus.push("Aktifkan minimal satu cashier atau manager agar operasional dapat dimonitor.");
  }

  if (monthlyTargetStatus === "behind") {
    healthFocus.push("Rapatkan strategi capai target bulanan: boost jam performa tinggi dan aktifkan promo harian.");
  } else if (monthlyTargetStatus === "at-risk") {
    healthFocus.push("Jaga laju omzet agar target bulanan tetap aman dengan campaign taktis di hari tersisa.");
  }

  if (decliningMomentumProducts.length >= 3) {
    healthFocus.push("Beberapa produk inti melemah pada periode aktif, evaluasi pricing, display, dan strategi promo per produk.");
  }

  if (healthFocus.length === 0) {
    healthFocus.push("Pertahankan ritme operasional saat ini dan pantau konsistensi performa harian.");
  }

  const dashboardFeedHref = `/api/dashboard-summary?tenantId=${encodeURIComponent(tenantId)}&periodDays=${periodDays}&source=${encodeURIComponent(sourceFilter)}&dayType=${encodeURIComponent(dayTypeFilter)}&target=${monthlyTarget}`;
  const dashboardResetFilterHref = `/api/dashboard-summary?tenantId=${encodeURIComponent(tenantId)}&periodDays=${periodDays}&source=all&dayType=all&target=${monthlyTarget}`;

  const insights: DashboardInsight[] = [];

  if (anomalyRadar.alertHours >= 2) {
    insights.push({
      level: "high",
      title: "Anomali Jam Operasional",
      detail: anomalyRadar.summary,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  } else if (anomalyRadar.opportunityHours >= 2) {
    insights.push({
      level: "low",
      title: "Peluang Jam Emas",
      detail: anomalyRadar.summary,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  const recoverPlaybookSource = sourcePlaybook.items.find((item) => item.priority === "recover");
  if (recoverPlaybookSource) {
    insights.push({
      level: "medium",
      title: "Kanal Prioritas Recovery",
      detail: `${recoverPlaybookSource.label} perlu dipulihkan. ${recoverPlaybookSource.action}`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  if ((sourceFilter !== "all" || dayTypeFilter !== "all") && filteredTransactionsTotal === 0) {
    insights.push({
      level: "medium",
      title: "Filter Tidak Menemukan Data",
      detail: "Tidak ada transaksi dalam kombinasi source/day type terpilih. Coba perluas filter untuk analisis yang lebih representatif.",
      actionLabel: "Reset Filter Feed",
      actionHref: dashboardResetFilterHref
    });
  }

  if ((sourceFilter !== "all" || dayTypeFilter !== "all") && filteredTransactionsTotal > 0) {
    const direction = filteredRevenueDeltaPct >= 0 ? "naik" : "turun";
    insights.push({
      level: filteredRevenueDeltaPct >= 0 ? "low" : "medium",
      title: `Lens ${filteredSnapshotLabel}`,
      detail: `Omzet terfilter ${direction} ${Math.abs(filteredRevenueDeltaPct).toFixed(1)}% dengan proyeksi 30 hari ${Math.round(filteredProjectedMonthlyRevenue).toLocaleString("id-ID")}.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  if (benchmark7 && benchmark30 && benchmark7.revenueDeltaPct > 0 && benchmark30.revenueDeltaPct < 0) {
    insights.push({
      level: "medium",
      title: "Sinyal Recovery Jangka Pendek",
      detail: `Window 7 hari sudah naik ${benchmark7.revenueDeltaPct.toFixed(1)}%, namun 30 hari masih turun ${Math.abs(benchmark30.revenueDeltaPct).toFixed(1)}%. Pertahankan momentum dengan promosi konsisten.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  if (benchmark7 && benchmark30 && benchmark7.revenueDeltaPct < 0 && benchmark30.revenueDeltaPct < 0) {
    insights.push({
      level: "high",
      title: "Tekanan Omzet Multi-Periode",
      detail: `Baik 7 hari (${benchmark7.revenueDeltaPct.toFixed(1)}%) maupun 30 hari (${benchmark30.revenueDeltaPct.toFixed(1)}%) sama-sama melemah. Prioritaskan action plan pemulihan demand.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  const strongestMomentumProduct = risingMomentumProducts.find((item) => item.shareRevenueCurrentPct >= 10);
  if (strongestMomentumProduct) {
    insights.push({
      level: "low",
      title: "Produk Momentum Positif",
      detail: `${strongestMomentumProduct.name} naik ${strongestMomentumProduct.revenueDeltaPct.toFixed(1)}% dan berkontribusi ${strongestMomentumProduct.shareRevenueCurrentPct.toFixed(1)}% pada omzet filter saat ini.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  const weakestMomentumProduct = decliningMomentumProducts.find((item) => item.revenueDeltaPct <= -15);
  if (weakestMomentumProduct) {
    insights.push({
      level: "medium",
      title: "Produk Perlu Intervensi",
      detail: `${weakestMomentumProduct.name} turun ${Math.abs(weakestMomentumProduct.revenueDeltaPct).toFixed(1)}% dibanding window sebelumnya. Cek stok, harga, dan positioning produk ini.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  const strongestSourceMomentum = sourceMomentum.find((item) => item.momentum === "accelerating" && item.shareRevenueCurrentPct >= 15);
  if (strongestSourceMomentum) {
    insights.push({
      level: "low",
      title: "Kanal Sedang Melaju",
      detail: `${strongestSourceMomentum.label} naik ${strongestSourceMomentum.revenueDeltaPct.toFixed(1)}% dan menyumbang ${strongestSourceMomentum.shareRevenueCurrentPct.toFixed(1)}% omzet window aktif.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  const weakestSourceMomentum = sourceMomentum.find((item) => item.momentum === "cooling" && item.shareRevenueCurrentPct >= 20);
  if (weakestSourceMomentum) {
    insights.push({
      level: "medium",
      title: "Kanal Perlu Recovery",
      detail: `${weakestSourceMomentum.label} turun ${Math.abs(weakestSourceMomentum.revenueDeltaPct).toFixed(1)}% dengan kontribusi omzet besar. Prioritaskan intervensi kanal ini.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  if (monthlyTarget > 0 && monthlyTargetStatus === "behind") {
    insights.push({
      level: "high",
      title: "Risiko Gagal Target Bulanan",
      detail: `Proyeksi bulan ini ${Math.round(projectedMonthEndRevenue).toLocaleString("id-ID")}, masih di bawah target ${monthlyTarget.toLocaleString("id-ID")}.` ,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  } else if (monthlyTarget > 0 && monthlyTargetStatus === "at-risk") {
    insights.push({
      level: "medium",
      title: "Target Bulanan Perlu Dipantau",
      detail: `Butuh rata-rata ${Math.round(requiredDailyRevenueForTarget).toLocaleString("id-ID")} per hari untuk menutup gap target bulan ini.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  if (monthlyTarget > 0) {
    const likelyScenario = targetScenarioItems
      .filter((item) => item.projectedMonthEndRevenue >= monthlyTarget)
      .sort((a, b) => b.winProbabilityPct - a.winProbabilityPct)[0];

    if (likelyScenario) {
      insights.push({
        level: "low",
        title: "Scenario Planner Menunjukkan Jalur Capai Target",
        detail: `${likelyScenario.label} memiliki peluang ${likelyScenario.winProbabilityPct.toFixed(1)}% dengan proyeksi ${Math.round(likelyScenario.projectedMonthEndRevenue).toLocaleString("id-ID")}.`,
        actionLabel: "Review Feed Dashboard",
        actionHref: dashboardFeedHref
      });
    } else {
      const bestScenario = targetScenarioItems
        .slice()
        .sort((a, b) => b.projectedMonthEndRevenue - a.projectedMonthEndRevenue)[0];

      if (bestScenario) {
        insights.push({
          level: "high",
          title: "Scenario Planner: Semua Skenario Belum Menutup Target",
          detail: `Skenario terbaik saat ini ${bestScenario.label} masih menyisakan gap ${Math.round(Math.max(0, bestScenario.targetGap)).toLocaleString("id-ID")}.`,
          actionLabel: "Review Feed Dashboard",
          actionHref: dashboardFeedHref
        });
      }
    }
  }

  if (subscriptionStatus === "past_due" || subscriptionStatus === "canceled") {
    insights.push({
      level: "high",
      title: "Prioritaskan Kesehatan Subscription",
      detail: "Segera selesaikan status pembayaran untuk mencegah gangguan sinkronisasi operasional.",
      actionLabel: "Cek Status Sistem",
      actionHref: "/api/health"
    });
  }

  if (trendRevenueDeltaPct <= -8) {
    insights.push({
      level: "high",
      title: `Performa ${periodDays} Hari Melemah`,
      detail: `Omzet periode ini turun ${Math.abs(trendRevenueDeltaPct).toFixed(1)}% dibanding periode sebelumnya. Prioritaskan recovery traffic dan promosi targeted.`,
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  if (averageTicketDeltaPct <= -10) {
    insights.push({
      level: "medium",
      title: "Average Ticket Turun",
      detail: "Aktifkan bundling atau add-on di kasir agar nilai transaksi per pelanggan kembali naik.",
      actionLabel: "Review Feed Dashboard",
      actionHref: dashboardFeedHref
    });
  }

  if (dominantSource && dominantSource.shareTransactionsPct >= 85) {
    insights.push({
      level: "medium",
      title: "Kanal Penjualan Terlalu Terpusat",
      detail: `Sebanyak ${dominantSource.shareTransactionsPct.toFixed(1)}% transaksi berasal dari ${dominantSource.source}. Pertimbangkan diversifikasi kanal.`,
      actionLabel: "Lihat Distribusi Sumber",
      actionHref: dashboardFeedHref
    });
  }

  if (topProducts.length > 0) {
    const top = topProducts[0];
    insights.push({
      level: "low",
      title: "Produk Paling Laku Hari Ini",
      detail: `${top.name} terjual ${top.qty} unit dengan gross ${top.gross.toLocaleString("id-ID")}. Pastikan stok aman untuk jam sibuk berikutnya.`,
      actionLabel: "Pantau Tim Kasir",
      actionHref: "/api/owner/users"
    });
  }

  if (insights.length === 0) {
    insights.push({
      level: "low",
      title: "Pertahankan Ritme Operasional",
      detail: "Kinerja hari ini stabil. Fokus pada konsistensi layanan dan kecepatan checkout.",
      actionLabel: "Lihat API Health",
      actionHref: "/api/health"
    });
  }

  return {
    tenantId,
    todayRevenue,
    todayTransactions,
    yesterdayRevenue,
    yesterdayTransactions,
    revenueDeltaPct,
    transactionsDeltaPct,
    averageTicketToday,
    averageTicketYesterday,
    averageTicketDeltaPct,
    pendingSync,
    subscriptionStatus,
    activeCashiers,
    activeManagers,
    activeProducts,
    lastTransactionAt,
    generatedAt: generatedAt.toISOString(),
    trendPeriodDays: periodDays,
    trendRevenueTotal,
    trendRevenuePrevious,
    trendRevenueDeltaPct,
    trendTransactionsTotal,
    trendTransactionsPrevious,
    trendTransactionsDeltaPct,
    trendAverageDailyRevenue,
    projectedMonthlyRevenue,
    trendPeakDayLabel,
    weekRevenue,
    recentSales,
    alerts,
    sourceMix,
    topProducts,
    dayTypeMix,
    hourlySales,
    bestHourLabel,
    activeFilters: {
      source: sourceFilter,
      dayType: dayTypeFilter
    },
    filteredSnapshot: {
      label: filteredSnapshotLabel,
      revenueTotal: filteredRevenueTotal,
      revenuePrevious: filteredRevenuePrevious,
      revenueDeltaPct: filteredRevenueDeltaPct,
      transactionsTotal: filteredTransactionsTotal,
      transactionsPrevious: filteredTransactionsPrevious,
      transactionsDeltaPct: filteredTransactionsDeltaPct,
      averageTicket: filteredAverageTicket,
      peakHourLabel: filteredPeakHourLabel,
      projectedMonthlyRevenue: filteredProjectedMonthlyRevenue,
      bestDayLabel: filteredBestDayLabel,
      worstDayLabel: filteredWorstDayLabel
    },
    filteredDailyBreakdown,
    periodBenchmarks,
    productMomentum,
    sourceMomentum,
    anomalyRadar,
    sourcePlaybook,
    monthlyTargetTracker,
    executionPlanner,
    dailyMission,
    consistencyRadar,
    targetScenarioSimulator,
    healthScore,
    healthLabel,
    healthFocus: healthFocus.slice(0, 3),
    insights: insights.slice(0, 3)
  };
}
