import { useMemo } from "react";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import { resolveEffectiveCostPrice } from "../hpp";
import type {
  AnomalyRadarSummary,
  ConsistencyRadarSummary,
  DailyBreakdownSummary,
  DailyMissionSummary,
  ExecutionPlannerSummary,
  HourlyAnomalySummary,
  OwnerAnalyticsData,
  OwnerAnalyticsPeriod,
  PaymentMomentumSummary,
  PaymentMethodSummary,
  TargetScenarioSummary,
  TimeSlotSummary,
  TopProductSummary
} from "../components/owner-analytics/types";

const timeSlots = [
  { label: "06-10", start: 6, end: 10 },
  { label: "10-14", start: 10, end: 14 },
  { label: "14-18", start: 14, end: 18 },
  { label: "18-22", start: 18, end: 22 },
  { label: "22-06", start: 22, end: 30 }
] as const;

const paymentConfig: Record<"cash" | "card" | "qris", { label: string; barClass: string }> = {
  cash: {
    label: "Cash",
    barClass: "bg-primary"
  },
  card: {
    label: "Card",
    barClass: "bg-tertiary"
  },
  qris: {
    label: "QRIS",
    barClass: "bg-secondary"
  }
};

const DAY_MS = 24 * 60 * 60 * 1000;

const toNumber = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return value;
};

const clampPercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-999, Math.min(999, value));
};

const round = (value: number, fractionDigits = 1) => {
  const base = Math.pow(10, fractionDigits);
  return Math.round(toNumber(value) * base) / base;
};

const calcDeltaPct = (current: number, previous: number) => {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolvePeriodStart = (now: Date, period: OwnerAnalyticsPeriod) => {
  if (period === "30d") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).getTime();
  }

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
};

const toHourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export function useOwnerAnalyticsData(input: {
  sales: LocalSale[];
  products: ProductItem[];
  period: OwnerAnalyticsPeriod;
  monthlyTarget?: number;
}): OwnerAnalyticsData {
  const { sales, products, period } = input;
  const monthlyTarget = Math.max(0, Math.round(input.monthlyTarget ?? 0));

  return useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startTomorrow = startToday + DAY_MS;
    const periodStart = resolvePeriodStart(now, period);
    const periodDays = Math.max(1, Math.round((startTomorrow - periodStart) / DAY_MS));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const elapsedDaysInMonth = now.getDate();
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDaysAfterToday = Math.max(0, totalDaysInMonth - elapsedDaysInMonth);
    const daysLeftIncludingToday = Math.max(1, totalDaysInMonth - elapsedDaysInMonth + 1);

    const productCostMap = new Map<string, number>(
      products.map((product) => [product.id, resolveEffectiveCostPrice(product)])
    );

    const salesWithTime = sales
      .map((sale) => ({
        sale,
        timestamp: new Date(sale.createdAt).getTime()
      }))
      .filter((item) => Number.isFinite(item.timestamp));

    const completedSalesWithTime = salesWithTime.filter((item) => item.sale.status === "completed");

    const calcCogs = (sale: LocalSale) =>
      sale.items.reduce((acc, item) => {
        const cost = item.costPrice ?? productCostMap.get(item.id) ?? 0;
        return acc + cost * item.qty;
      }, 0);

    const todaySales = completedSalesWithTime
      .filter((item) => item.timestamp >= startToday && item.timestamp < startTomorrow)
      .map((item) => item.sale);

    const refundedToday = salesWithTime.filter(
      (item) => item.sale.status === "refunded" && item.timestamp >= startToday && item.timestamp < startTomorrow
    ).length;

    const voidedToday = salesWithTime.filter(
      (item) => item.sale.status === "voided" && item.timestamp >= startToday && item.timestamp < startTomorrow
    ).length;

    const omzetToday = todaySales.reduce((acc, sale) => acc + sale.total, 0);
    const cogsToday = todaySales.reduce((acc, sale) => acc + calcCogs(sale), 0);
    const marginToday = omzetToday - cogsToday;
    const marginPercent = omzetToday > 0 ? (marginToday / omzetToday) * 100 : 0;
    const trxToday = todaySales.length;
    const avgTicket = trxToday > 0 ? omzetToday / trxToday : 0;
    const totalDiscount = todaySales.reduce((acc, sale) => acc + sale.discountAmount, 0);

    const paymentMap: Record<"cash" | "card" | "qris", { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      qris: { count: 0, total: 0 }
    };

    for (const sale of todaySales) {
      paymentMap[sale.paymentMethod].count += 1;
      paymentMap[sale.paymentMethod].total += sale.total;
    }

    const maxPaymentTotal = Math.max(paymentMap.cash.total, paymentMap.card.total, paymentMap.qris.total, 1);

    const paymentSummary: PaymentMethodSummary[] = (Object.keys(paymentMap) as Array<"cash" | "card" | "qris">).map((key) => {
      const summary = paymentMap[key];
      return {
        key,
        label: paymentConfig[key].label,
        count: summary.count,
        total: summary.total,
        percent: Math.round((summary.total / maxPaymentTotal) * 100),
        barClass: paymentConfig[key].barClass
      };
    });

    const slotCounts = timeSlots.map((slot) => {
      const count = todaySales.filter((sale) => {
        const hour = new Date(sale.createdAt).getHours();
        const normalizedHour = hour < 6 ? hour + 24 : hour;
        return normalizedHour >= slot.start && normalizedHour < slot.end;
      }).length;
      return { label: slot.label, count };
    });

    const maxSlotCount = Math.max(...slotCounts.map((slot) => slot.count), 1);
    const timeSlotSummary: TimeSlotSummary[] = slotCounts.map((slot) => ({
      ...slot,
      percent: Math.round((slot.count / maxSlotCount) * 100)
    }));

    const productMap = new Map<string, number>();
    for (const sale of todaySales) {
      for (const item of sale.items) {
        productMap.set(item.name, (productMap.get(item.name) ?? 0) + item.qty);
      }
    }

    const topProducts: TopProductSummary[] = Array.from(productMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const trendDays = 7;
    const trend = Array.from({ length: trendDays }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (trendDays - 1 - index));
      const start = date.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      const daySales = completedSalesWithTime
        .filter((item) => item.timestamp >= start && item.timestamp < end)
        .map((item) => item.sale);

      const revenue = daySales.reduce((acc, sale) => acc + sale.total, 0);
      return {
        label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        revenue
      };
    });

    const maxTrendRevenue = Math.max(...trend.map((entry) => entry.revenue), 1);

    const periodSales = salesWithTime
      .filter((item) => item.timestamp >= periodStart && item.timestamp < startTomorrow)
      .map((item) => item.sale);

    const periodCompleted = periodSales.filter((sale) => sale.status === "completed");
    const periodRevenue = periodCompleted.reduce((acc, sale) => acc + sale.total, 0);
    const periodCogs = periodCompleted.reduce((acc, sale) => acc + calcCogs(sale), 0);
    const periodMargin = periodRevenue - periodCogs;

    const periodDailyMap = new Map<string, { revenue: number; transactions: number }>();
    for (const sale of periodCompleted) {
      const key = toDateKey(new Date(sale.createdAt));
      const current = periodDailyMap.get(key) ?? { revenue: 0, transactions: 0 };
      current.revenue += sale.total;
      current.transactions += 1;
      periodDailyMap.set(key, current);
    }

    const periodDailyBreakdown: DailyBreakdownSummary[] = Array.from({ length: periodDays }, (_, index) => {
      const date = new Date(periodStart + index * DAY_MS);
      const key = toDateKey(date);
      const current = periodDailyMap.get(key) ?? { revenue: 0, transactions: 0 };
      return {
        date: key,
        label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        revenue: current.revenue,
        transactions: current.transactions,
        averageTicket: current.transactions > 0 ? current.revenue / current.transactions : 0
      };
    });

    const outletMap = new Map<string, { omzet: number; trx: number }>();
    for (const sale of periodCompleted) {
      const outletKey = sale.outletId || "MAIN";
      const existing = outletMap.get(outletKey) ?? { omzet: 0, trx: 0 };
      existing.omzet += sale.total;
      existing.trx += 1;
      outletMap.set(outletKey, existing);
    }

    const outletSummary = Array.from(outletMap.entries())
      .map(([outletId, value]) => ({ outletId, ...value }))
      .sort((a, b) => b.omzet - a.omzet);

    const monthToDateCompleted = completedSalesWithTime
      .filter((item) => item.timestamp >= monthStart && item.timestamp < startTomorrow)
      .map((item) => item.sale);

    const monthToDateRevenue = monthToDateCompleted.reduce((acc, sale) => acc + sale.total, 0);
    const monthToDateTransactions = monthToDateCompleted.length;
    const monthRevenueBeforeToday = completedSalesWithTime
      .filter((item) => item.timestamp >= monthStart && item.timestamp < startToday)
      .reduce((acc, item) => acc + item.sale.total, 0);

    const targetProgressPct = monthlyTarget > 0 ? round((monthToDateRevenue / monthlyTarget) * 100, 1) : 0;
    const timeProgressPct = round((elapsedDaysInMonth / totalDaysInMonth) * 100, 1);
    const projectedMonthEndRevenue =
      elapsedDaysInMonth > 0 ? (monthToDateRevenue / elapsedDaysInMonth) * totalDaysInMonth : 0;

    const requiredDailyRevenueForTarget =
      monthlyTarget > 0
        ? Math.max((monthlyTarget - monthToDateRevenue) / Math.max(1, remainingDaysAfterToday), 0)
        : 0;

    const targetGap = monthlyTarget > 0 ? monthlyTarget - projectedMonthEndRevenue : 0;

    const previousWindowStart = periodStart - periodDays * DAY_MS;
    const currentWindowSales = completedSalesWithTime
      .filter((item) => item.timestamp >= periodStart && item.timestamp < startTomorrow)
      .map((item) => item.sale);

    const previousWindowSales = completedSalesWithTime
      .filter((item) => item.timestamp >= previousWindowStart && item.timestamp < periodStart)
      .map((item) => item.sale);

    const currentPaymentMap: Record<"cash" | "card" | "qris", { revenue: number; transactions: number }> = {
      cash: { revenue: 0, transactions: 0 },
      card: { revenue: 0, transactions: 0 },
      qris: { revenue: 0, transactions: 0 }
    };

    const previousPaymentMap: Record<"cash" | "card" | "qris", { revenue: number; transactions: number }> = {
      cash: { revenue: 0, transactions: 0 },
      card: { revenue: 0, transactions: 0 },
      qris: { revenue: 0, transactions: 0 }
    };

    for (const sale of currentWindowSales) {
      currentPaymentMap[sale.paymentMethod].revenue += sale.total;
      currentPaymentMap[sale.paymentMethod].transactions += 1;
    }

    for (const sale of previousWindowSales) {
      previousPaymentMap[sale.paymentMethod].revenue += sale.total;
      previousPaymentMap[sale.paymentMethod].transactions += 1;
    }

    const currentPaymentTotal = Object.values(currentPaymentMap).reduce((sum, entry) => sum + entry.revenue, 0);
    const previousPaymentTotal = Object.values(previousPaymentMap).reduce((sum, entry) => sum + entry.revenue, 0);

    const paymentMomentum: PaymentMomentumSummary[] = (["cash", "card", "qris"] as const)
      .map((key) => {
        const current = currentPaymentMap[key];
        const previous = previousPaymentMap[key];
        const revenueDeltaPct = clampPercent(calcDeltaPct(current.revenue, previous.revenue));
        const transactionsDeltaPct = clampPercent(
          calcDeltaPct(current.transactions, previous.transactions)
        );

        let momentum: PaymentMomentumSummary["momentum"] = "stable";
        if (revenueDeltaPct >= 8 || transactionsDeltaPct >= 8) {
          momentum = "accelerating";
        } else if (revenueDeltaPct <= -8 || transactionsDeltaPct <= -8) {
          momentum = "cooling";
        }

        return {
          key,
          label: paymentConfig[key].label,
          revenueCurrent: current.revenue,
          revenuePrevious: previous.revenue,
          revenueDeltaPct,
          transactionsCurrent: current.transactions,
          transactionsPrevious: previous.transactions,
          transactionsDeltaPct,
          averageTicketCurrent: current.transactions > 0 ? current.revenue / current.transactions : 0,
          averageTicketPrevious: previous.transactions > 0 ? previous.revenue / previous.transactions : 0,
          shareRevenueCurrentPct: currentPaymentTotal > 0 ? round((current.revenue / currentPaymentTotal) * 100, 1) : 0,
          shareRevenuePreviousPct: previousPaymentTotal > 0 ? round((previous.revenue / previousPaymentTotal) * 100, 1) : 0,
          momentum
        } satisfies PaymentMomentumSummary;
      })
      .sort((a, b) => b.revenueCurrent - a.revenueCurrent);

    const baselineDaysWindow = Math.min(14, Math.max(3, periodDays - 1));
    const baselineStart = Math.max(monthStart, startToday - baselineDaysWindow * DAY_MS);

    const baselineSales = completedSalesWithTime.filter(
      (item) => item.timestamp >= baselineStart && item.timestamp < startToday
    );

    const baselineDateSet = new Set(
      baselineSales.map((item) => toDateKey(new Date(item.timestamp)))
    );

    const baselineDaysObserved = Math.max(1, baselineDateSet.size);
    const baselineHourlyRevenue = Array.from({ length: 24 }, () => 0);
    const baselineHourlyTransactions = Array.from({ length: 24 }, () => 0);
    const todayHourlyRevenue = Array.from({ length: 24 }, () => 0);
    const todayHourlyTransactions = Array.from({ length: 24 }, () => 0);

    for (const item of baselineSales) {
      const hour = new Date(item.timestamp).getHours();
      baselineHourlyRevenue[hour] += item.sale.total;
      baselineHourlyTransactions[hour] += 1;
    }

    for (const sale of todaySales) {
      const hour = new Date(sale.createdAt).getHours();
      todayHourlyRevenue[hour] += sale.total;
      todayHourlyTransactions[hour] += 1;
    }

    const hourlyAnomalies: HourlyAnomalySummary[] = Array.from({ length: 24 }, (_, hour) => {
      const baselineRevenue = baselineHourlyRevenue[hour] / baselineDaysObserved;
      const baselineTransactions = baselineHourlyTransactions[hour] / baselineDaysObserved;
      const todayRevenue = todayHourlyRevenue[hour];
      const todayTransactions = todayHourlyTransactions[hour];
      const deviationPct = clampPercent(calcDeltaPct(todayRevenue, baselineRevenue));

      let level: HourlyAnomalySummary["level"] = "watch";
      if (baselineRevenue >= 50000 && deviationPct <= -35) {
        level = "alert";
      } else if (todayRevenue >= 50000 && deviationPct >= 35) {
        level = "opportunity";
      } else if (Math.abs(deviationPct) >= 20) {
        level = "watch";
      }

      const action =
        level === "alert"
          ? "Jam ini di bawah baseline. Aktifkan promo cepat atau dorong upsell."
          : level === "opportunity"
            ? "Jam ini di atas baseline. Pastikan stok aman dan staff siap."
            : "Pantau jam ini dan jaga ritme transaksi tetap stabil.";

      return {
        hour,
        label: toHourLabel(hour),
        todayRevenue,
        baselineRevenue,
        todayTransactions,
        baselineTransactions,
        deviationPct,
        level,
        action
      };
    });

    const comparableHours = hourlyAnomalies.filter(
      (hour) => hour.todayRevenue > 0 || hour.baselineRevenue > 0
    );

    const stableHours = comparableHours.filter((hour) => Math.abs(hour.deviationPct) < 20).length;
    const notableHours = hourlyAnomalies
      .filter((hour) => Math.abs(hour.deviationPct) >= 20)
      .sort((a, b) => Math.abs(b.deviationPct) - Math.abs(a.deviationPct))
      .slice(0, 6);

    const alertHours = hourlyAnomalies.filter((hour) => hour.level === "alert").length;
    const opportunityHours = hourlyAnomalies.filter((hour) => hour.level === "opportunity").length;

    const anomalySummary =
      notableHours.length === 0
        ? "Pola per jam hari ini masih stabil terhadap baseline."
        : alertHours > opportunityHours
          ? "Terdapat penurunan di beberapa jam penting. Prioritaskan recovery pada jam lemah."
          : opportunityHours > alertHours
            ? "Ada momentum positif di jam tertentu. Maksimalkan stok dan service di jam puncak."
            : "Terjadi pergeseran pola per jam. Pantau jam anomali untuk menjaga konsistensi omzet.";

    const anomalyRadar: AnomalyRadarSummary = {
      baselineDays: baselineDaysObserved,
      stableHoursPct:
        comparableHours.length > 0 ? round((stableHours / comparableHours.length) * 100, 1) : 100,
      alertHours,
      opportunityHours,
      notableHours,
      summary: anomalySummary
    };

    const dailyRevenues = periodDailyBreakdown.map((day) => day.revenue);
    const averageDailyRevenue = periodDays > 0 ? periodRevenue / periodDays : 0;
    const variance =
      periodDays > 0
        ? dailyRevenues.reduce((acc, value) => {
            const gap = value - averageDailyRevenue;
            return acc + gap * gap;
          }, 0) / periodDays
        : 0;

    const volatilityPct =
      averageDailyRevenue > 0 ? round((Math.sqrt(variance) / averageDailyRevenue) * 100, 1) : 0;

    const activeDays = periodDailyBreakdown.filter((day) => day.revenue > 0).length;
    const activeDaysPct = periodDays > 0 ? round((activeDays / periodDays) * 100, 1) : 0;
    const zeroSalesDays = periodDays - activeDays;

    let bestStreakDays = 0;
    let weakStreakDays = 0;
    let activeStreak = 0;
    let weakStreak = 0;
    const weakThreshold = averageDailyRevenue > 0 ? averageDailyRevenue * 0.6 : 0;

    for (const day of periodDailyBreakdown) {
      if (day.revenue > 0) {
        activeStreak += 1;
      } else {
        activeStreak = 0;
      }

      if (day.revenue <= weakThreshold) {
        weakStreak += 1;
      } else {
        weakStreak = 0;
      }

      bestStreakDays = Math.max(bestStreakDays, activeStreak);
      weakStreakDays = Math.max(weakStreakDays, weakStreak);
    }

    const scoreRaw =
      100 - volatilityPct * 0.9 - (periodDays > 0 ? ((zeroSalesDays / periodDays) * 100) * 0.7 : 0);
    const consistencyScore = Math.max(0, Math.min(100, Math.round(scoreRaw)));

    let consistencyState: ConsistencyRadarSummary["state"] = "fragile";
    if (consistencyScore >= 75 && volatilityPct <= 30) {
      consistencyState = "stable";
    } else if (consistencyScore >= 50) {
      consistencyState = "volatile";
    }

    const consistencyRecommendation =
      consistencyState === "stable"
        ? "Pertahankan ritme promo dan jam operasional karena pola omzet sudah konsisten."
        : consistencyState === "volatile"
          ? "Kurangi gap hari lemah dengan promo terjadwal dan evaluasi SKU pada jam sepi."
          : "Fokuskan pemulihan pada 3 hari terlemah: aktivasi campaign dan kontrol stok wajib harian.";

    const consistencyRadar: ConsistencyRadarSummary = {
      state: consistencyState,
      score: consistencyScore,
      volatilityPct,
      activeDays,
      activeDaysPct,
      zeroSalesDays,
      bestStreakDays,
      weakStreakDays,
      recommendation: consistencyRecommendation
    };

    const baselineDailyRevenue = periodDays > 0 ? periodRevenue / periodDays : 0;
    const baselineTransactionsPerDay = periodDays > 0 ? periodCompleted.length / periodDays : 0;
    const baselineAverageTicket = periodCompleted.length > 0 ? periodRevenue / periodCompleted.length : 0;

    const requiredDailyRevenue =
      monthlyTarget > 0
        ? Math.max((monthlyTarget - monthToDateRevenue) / Math.max(1, daysLeftIncludingToday), 0)
        : 0;

    const requiredTransactionsPerDay =
      baselineAverageTicket > 0 ? requiredDailyRevenue / baselineAverageTicket : 0;

    const transactionsLiftPct =
      baselineTransactionsPerDay > 0
        ? clampPercent(calcDeltaPct(requiredTransactionsPerDay, baselineTransactionsPerDay))
        : 0;

    const requiredAverageTicket =
      baselineTransactionsPerDay > 0 ? requiredDailyRevenue / baselineTransactionsPerDay : baselineAverageTicket;

    const averageTicketLiftPct =
      baselineAverageTicket > 0
        ? clampPercent(calcDeltaPct(requiredAverageTicket, baselineAverageTicket))
        : 0;

    const recommendedFocusPayments = paymentMomentum
      .slice()
      .sort((a, b) => {
        const scoreA = a.shareRevenueCurrentPct + a.revenueDeltaPct * 0.35;
        const scoreB = b.shareRevenueCurrentPct + b.revenueDeltaPct * 0.35;
        return scoreB - scoreA;
      })
      .slice(0, 2)
      .map((item) => item.label);

    const sortedByTraffic = [...timeSlotSummary].sort((a, b) => b.count - a.count);
    const recommendedPeakHours = sortedByTraffic.slice(0, 2).map((slot) => slot.label);
    const recommendedSlowHours = sortedByTraffic
      .slice(-2)
      .map((slot) => slot.label)
      .filter((label, index, array) => array.indexOf(label) === index);

    let plannerStatus: ExecutionPlannerSummary["status"] = "off";
    if (monthlyTarget > 0) {
      if (projectedMonthEndRevenue >= monthlyTarget) {
        plannerStatus = "on-track";
      } else if (projectedMonthEndRevenue >= monthlyTarget * 0.9) {
        plannerStatus = "needs-push";
      } else {
        plannerStatus = "critical";
      }
    }

    const plannerPrimaryAction =
      plannerStatus === "on-track"
        ? "Pertahankan performa baseline dan amankan jam puncak agar progres target tidak turun."
        : plannerStatus === "needs-push"
          ? "Naikkan output harian dengan promo terukur pada metode bayar dan jam yang paling potensial."
          : plannerStatus === "critical"
            ? "Lakukan recovery agresif: bundling, aktivasi repeat order, dan kontrol diskon di jam lemah."
            : "Masukkan target bulanan agar planner dapat menghitung kebutuhan harian secara otomatis.";

    const plannerSecondaryAction =
      plannerStatus === "on-track"
        ? "Review margin minimum agar pertumbuhan omzet tetap sehat."
        : plannerStatus === "needs-push"
          ? "Naikkan average ticket lewat add-on dan paket hemat pada jam ramai."
          : plannerStatus === "critical"
            ? "Evaluasi produk low-rotation dan alihkan fokus ke SKU margin tinggi."
            : "Target bulanan dapat diisi pada panel Laporan Periodik.";

    const executionPlanner: ExecutionPlannerSummary = {
      status: plannerStatus,
      baselineDailyRevenue,
      requiredDailyRevenue,
      dailyRevenueGap: requiredDailyRevenue - baselineDailyRevenue,
      baselineTransactionsPerDay,
      requiredTransactionsPerDay,
      transactionsLiftPct,
      baselineAverageTicket,
      requiredAverageTicket,
      averageTicketLiftPct,
      recommendedFocusPayments,
      recommendedPeakHours,
      recommendedSlowHours,
      primaryAction: plannerPrimaryAction,
      secondaryAction: plannerSecondaryAction
    };

    const requiredRevenueToday =
      monthlyTarget > 0
        ? Math.max((monthlyTarget - monthRevenueBeforeToday) / Math.max(1, daysLeftIncludingToday), 0)
        : 0;

    const requiredTransactionsToday =
      baselineAverageTicket > 0 ? Math.ceil(requiredRevenueToday / baselineAverageTicket) : 0;

    const requiredAverageTicketToday =
      requiredTransactionsToday > 0 ? requiredRevenueToday / requiredTransactionsToday : 0;

    const dailyMissionProgress =
      requiredRevenueToday > 0 ? round((omzetToday / requiredRevenueToday) * 100, 1) : 0;

    let dailyMissionStatus: DailyMissionSummary["status"] = "off";
    if (monthlyTarget > 0) {
      if (dailyMissionProgress >= 110) {
        dailyMissionStatus = "ahead";
      } else if (dailyMissionProgress >= 85) {
        dailyMissionStatus = "on-track";
      } else {
        dailyMissionStatus = "behind";
      }
    }

    const dailyMissionFocus =
      dailyMissionStatus === "ahead"
        ? "Performa hari ini di atas kebutuhan target. Jaga kualitas layanan agar momentum tidak drop."
        : dailyMissionStatus === "on-track"
          ? "Misi harian masih aman. Dorong upsell ringan untuk mengunci target lebih cepat."
          : dailyMissionStatus === "behind"
            ? "Hari ini masih di bawah misi target. Fokuskan campaign pada jam lambat dan pelanggan repeat."
            : "Set target bulanan agar misi omzet harian muncul otomatis.";

    const missionNextActions =
      dailyMissionStatus === "ahead"
        ? [
            "Pertahankan stok SKU terlaris sampai jam tutup.",
            "Kurangi diskon berlebih agar margin tetap optimal."
          ]
        : dailyMissionStatus === "on-track"
          ? [
              "Aktifkan bundling di jam ramai untuk menaikkan average ticket.",
              "Push reminder ke pelanggan loyal sebelum jam puncak sore."
            ]
          : dailyMissionStatus === "behind"
            ? [
                "Jalankan promo pemulihan cepat pada slot jam terlemah.",
                "Prioritaskan produk margin tinggi untuk setiap transaksi tambahan."
              ]
            : ["Isi target bulanan pada panel laporan.", "Setelah itu sistem akan memberi kebutuhan omzet harian."];

    const dailyMission: DailyMissionSummary = {
      status: dailyMissionStatus,
      label: "Misi Omzet Hari Ini",
      requiredRevenue: requiredRevenueToday,
      achievedRevenue: omzetToday,
      revenueProgressPct: dailyMissionProgress,
      revenueGap: requiredRevenueToday - omzetToday,
      requiredTransactions: requiredTransactionsToday,
      achievedTransactions: trxToday,
      transactionsProgressPct:
        requiredTransactionsToday > 0 ? round((trxToday / requiredTransactionsToday) * 100, 1) : 0,
      transactionGap: requiredTransactionsToday - trxToday,
      requiredAverageTicket: requiredAverageTicketToday,
      achievedAverageTicket: avgTicket,
      averageTicketProgressPct:
        requiredAverageTicketToday > 0 ? round((avgTicket / requiredAverageTicketToday) * 100, 1) : 0,
      focusMessage: dailyMissionFocus,
      nextActions: missionNextActions
    };

    const scenarioConfigs: Array<{
      level: TargetScenarioSummary["level"];
      label: string;
      revenueFactor: number;
      trxFactor: number;
      ticketFactor: number;
      action: string;
    }> = [
      {
        level: "conservative",
        label: "Konservatif",
        revenueFactor: 0.92,
        trxFactor: 0.95,
        ticketFactor: 0.98,
        action: "Amankan performa harian saat ini dengan fokus stabilitas operasional."
      },
      {
        level: "baseline",
        label: "Baseline",
        revenueFactor: 1,
        trxFactor: 1,
        ticketFactor: 1,
        action: "Pertahankan ritme sekarang sambil optimasi slot jam lambat."
      },
      {
        level: "stretch",
        label: "Stretch",
        revenueFactor: 1.15,
        trxFactor: 1.08,
        ticketFactor: 1.05,
        action: "Dorong pertumbuhan agresif lewat campaign, bundling, dan aktivasi pelanggan loyal."
      }
    ];

    const targetScenarioSimulator = {
      baselineDailyRevenue,
      baselineTransactionsPerDay,
      baselineAverageTicket,
      volatilityPct: consistencyRadar.volatilityPct,
      scenarios: scenarioConfigs.map((scenario) => {
        const scenarioDailyRevenue = baselineDailyRevenue * scenario.revenueFactor;
        const scenarioDailyTransactions = baselineTransactionsPerDay * scenario.trxFactor;
        const scenarioDailyTicket = baselineAverageTicket * scenario.ticketFactor;
        const projectedRevenue =
          monthToDateRevenue + scenarioDailyRevenue * Math.max(0, totalDaysInMonth - elapsedDaysInMonth);

        const scenarioTargetGap = monthlyTarget > 0 ? monthlyTarget - projectedRevenue : 0;
        const projectedProgressPct = monthlyTarget > 0 ? round((projectedRevenue / monthlyTarget) * 100, 1) : 0;
        const scenarioRequiredDailyRevenue =
          monthlyTarget > 0
            ? Math.max((monthlyTarget - monthToDateRevenue) / Math.max(1, daysLeftIncludingToday), 0)
            : 0;

        const scenarioRequiredTransactions =
          scenarioDailyTicket > 0 ? scenarioRequiredDailyRevenue / scenarioDailyTicket : 0;

        const scenarioRequiredAvgTicket =
          scenarioDailyTransactions > 0 ? scenarioRequiredDailyRevenue / scenarioDailyTransactions : 0;

        const baseProbability = monthlyTarget > 0 ? (projectedRevenue / monthlyTarget) * 100 : 0;
        const levelOffset =
          scenario.level === "conservative" ? 12 : scenario.level === "stretch" ? -12 : 0;
        const volatilityPenalty =
          consistencyRadar.volatilityPct *
          (scenario.level === "stretch" ? 0.55 : scenario.level === "baseline" ? 0.35 : 0.2);

        const winProbabilityPct =
          monthlyTarget > 0
            ? Math.max(5, Math.min(95, Math.round(baseProbability + levelOffset - volatilityPenalty)))
            : 0;

        return {
          level: scenario.level,
          label: scenario.label,
          projectedMonthEndRevenue: projectedRevenue,
          targetGap: scenarioTargetGap,
          projectedProgressPct,
          requiredDailyRevenue: scenarioRequiredDailyRevenue,
          requiredTransactionsPerDay: scenarioRequiredTransactions,
          requiredAverageTicket: scenarioRequiredAvgTicket,
          winProbabilityPct,
          action: scenario.action
        } satisfies TargetScenarioSummary;
      })
    };

    return {
      omzetToday,
      cogsToday,
      marginToday,
      marginPercent,
      trxToday,
      avgTicket,
      totalDiscount,
      refundedToday,
      voidedToday,
      paymentSummary,
      timeSlotSummary,
      topProducts,
      trend,
      maxTrendRevenue,
      periodDays,
      periodDailyBreakdown,
      periodSales,
      periodCompleted,
      periodRevenue,
      periodMargin,
      periodMarginPercent: periodRevenue > 0 ? (periodMargin / periodRevenue) * 100 : 0,
      outletSummary,
      monthlyTarget,
      monthToDateRevenue,
      monthToDateTransactions,
      elapsedDaysInMonth,
      totalDaysInMonth,
      targetProgressPct,
      timeProgressPct,
      projectedMonthEndRevenue,
      requiredDailyRevenueForTarget,
      targetGap,
      paymentMomentum,
      anomalyRadar,
      executionPlanner,
      dailyMission,
      consistencyRadar,
      targetScenarioSimulator
    };
  }, [sales, products, period, monthlyTarget]);
}

export function downloadOwnerAnalyticsCsv(period: OwnerAnalyticsPeriod, periodSales: LocalSale[]) {
  const header = "id,tanggal,outlet,status,metode,total,subtotal,diskon";
  const rows = periodSales.map((sale) =>
    [
      sale.id,
      sale.createdAt,
      sale.outletId || "MAIN",
      sale.status,
      sale.paymentMethod,
      sale.total,
      sale.subtotal,
      sale.discountAmount
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `owner-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
