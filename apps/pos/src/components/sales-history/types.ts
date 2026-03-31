import type { LocalSale } from "../../database";

export type SalesHistoryProps = {
  sales: LocalSale[];
  onPrint?: (saleId: string) => void;
  onRequestRefund?: (saleId: string, reason: string) => void;
  onRequestVoid?: (saleId: string, reason: string) => void;
};

export type SalesStatusFilter = "all" | "completed" | "refunded" | "voided";

export type SalesMethodFilter = "all" | "cash" | "card" | "qris" | "split";

export type ActiveSalesAction = {
  saleId: string;
  mode: "refund" | "void";
} | null;
