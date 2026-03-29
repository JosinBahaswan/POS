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

export type ActiveSection = "cashier" | "products" | "reports" | "history" | "analytics" | "users" | "customers" | "suppliers" | "promotions";

// --- NEW ADVANCED FEATURES TYPES ---

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  loyalty_points: number;
  member_tier: "Silver" | "Gold" | "Platinum";
  outstanding_debt: number;
};

export type PromotionType = "bogo" | "bundle" | "wholesale" | "happy_hour";

export type Promotion = {
  id: string;
  name: string;
  type: PromotionType;
  condition_config: any; // e.g., JSON structure for "buy X get Y"
  start_date?: string;
  end_date?: string;
  is_active: boolean;
};

export type SplitPayment = {
  id: string;
  transaction_id: string;
  payment_method: PaymentMethod | "debt";
  amount: number;
};

export type Return = {
  id: string;
  transaction_id: string;
  reason: string;
  refund_amount: number;
  return_type: "void" | "defect" | "exchange";
};

export type Supplier = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
};

export type PurchaseOrderStatus = "draft" | "sent" | "received" | "cancelled";

export type PurchaseOrder = {
  id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  expected_date?: string;
  total_amount: number;
};
