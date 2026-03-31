import type { LocalSale } from "../../database";

export function saleIsSplitPayment(sale: LocalSale) {
  if (!sale.paymentBreakdown) return false;
  const parts = [sale.paymentBreakdown.cash, sale.paymentBreakdown.card, sale.paymentBreakdown.qris].filter(
    (part) => part > 0
  );
  return parts.length > 1;
}

export function getSaleStatusBadgeClass(status: LocalSale["status"]) {
  if (status === "refunded") {
    return "inline-flex items-center gap-1 rounded-full bg-error-container px-2.5 py-1 text-[11px] font-bold text-error";
  }

  if (status === "voided") {
    return "inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2.5 py-1 text-[11px] font-bold text-on-tertiary-fixed-variant";
  }

  return "inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1 text-[11px] font-bold text-on-secondary-container";
}

export function getCustomerLabel(sale: LocalSale) {
  const customer = sale.customerId?.trim();
  if (!customer) return "Walk-in";
  return customer;
}

export function getCustomerInitials(label: string) {
  const words = label.split(/[\s-_]+/).filter(Boolean);
  if (words.length === 0) return "NA";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export function paymentMethodLabel(sale: LocalSale) {
  if (saleIsSplitPayment(sale)) return "Split";
  if (sale.paymentMethod === "cash") return "Cash";
  if (sale.paymentMethod === "card") return "Card";
  return "QRIS";
}

export function paymentMethodIcon(sale: LocalSale) {
  if (saleIsSplitPayment(sale)) return "account_balance_wallet";
  if (sale.paymentMethod === "cash") return "payments";
  if (sale.paymentMethod === "card") return "credit_card";
  return "qr_code_2";
}
