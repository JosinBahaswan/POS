import { useMemo } from "react";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import { resolveEffectiveCostPrice } from "../hpp";
import type {
  OwnerAnalyticsData,
  OwnerAnalyticsPeriod,
  PaymentMethodSummary,
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

export function useOwnerAnalyticsData(input: {
  sales: LocalSale[];
  products: ProductItem[];
  period: OwnerAnalyticsPeriod;
}): OwnerAnalyticsData {
  const { sales, products, period } = input;

  return useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const productCostMap = new Map<string, number>(
      products.map((product) => [product.id, resolveEffectiveCostPrice(product)])
    );
    const completedSales = sales.filter((sale) => sale.status === "completed");

    const calcCogs = (sale: LocalSale) =>
      sale.items.reduce((acc, item) => {
        const cost = item.costPrice ?? productCostMap.get(item.id) ?? 0;
        return acc + cost * item.qty;
      }, 0);

    const todaySales = completedSales.filter((sale) => new Date(sale.createdAt).getTime() >= startToday);
    const refundedToday = sales.filter(
      (sale) => sale.status === "refunded" && new Date(sale.createdAt).getTime() >= startToday
    ).length;
    const voidedToday = sales.filter(
      (sale) => sale.status === "voided" && new Date(sale.createdAt).getTime() >= startToday
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
      const daySales = completedSales.filter((sale) => {
        const timestamp = new Date(sale.createdAt).getTime();
        return timestamp >= start && timestamp < end;
      });
      const revenue = daySales.reduce((acc, sale) => acc + sale.total, 0);
      return {
        label: date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        revenue
      };
    });

    const maxTrendRevenue = Math.max(...trend.map((entry) => entry.revenue), 1);

    const periodStart = (() => {
      if (period === "30d") {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).getTime();
      }
      if (period === "month") {
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      }
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
    })();

    const periodSales = sales.filter((sale) => new Date(sale.createdAt).getTime() >= periodStart);
    const periodCompleted = periodSales.filter((sale) => sale.status === "completed");
    const periodRevenue = periodCompleted.reduce((acc, sale) => acc + sale.total, 0);
    const periodCogs = periodCompleted.reduce((acc, sale) => acc + calcCogs(sale), 0);
    const periodMargin = periodRevenue - periodCogs;

    const outletMap = new Map<string, { omzet: number; trx: number }>();
    for (const sale of completedSales) {
      const outletKey = sale.outletId || "MAIN";
      const existing = outletMap.get(outletKey) ?? { omzet: 0, trx: 0 };
      existing.omzet += sale.total;
      existing.trx += 1;
      outletMap.set(outletKey, existing);
    }

    const outletSummary = Array.from(outletMap.entries())
      .map(([outletId, value]) => ({ outletId, ...value }))
      .sort((a, b) => b.omzet - a.omzet);

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
      periodSales,
      periodCompleted,
      periodRevenue,
      periodMargin,
      periodMarginPercent: periodRevenue > 0 ? (periodMargin / periodRevenue) * 100 : 0,
      outletSummary
    };
  }, [sales, products, period]);
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
