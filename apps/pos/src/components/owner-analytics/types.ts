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

export type OutletSummary = {
  outletId: string;
  omzet: number;
  trx: number;
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
  periodSales: LocalSale[];
  periodCompleted: LocalSale[];
  periodRevenue: number;
  periodMargin: number;
  periodMarginPercent: number;
  outletSummary: OutletSummary[];
};
