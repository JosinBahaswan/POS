export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  basePrice?: number;
  promoPercent?: number;
  costPrice?: number;
};

export type PaymentMethod = "cash" | "card" | "qris";

export type PaymentBreakdown = {
  cash: number;
  card: number;
  qris: number;
};

export type UserRole = "cashier" | "manager" | "owner";

export type TransactionStatus = "completed" | "refunded" | "voided";

export type ActiveSection = "cashier" | "products" | "reports" | "history" | "analytics" | "users";
