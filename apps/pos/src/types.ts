export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type PaymentMethod = "cash" | "card" | "qris";

export type UserRole = "cashier" | "manager" | "owner";

export type ActiveSection = "cashier" | "products" | "reports" | "users";
