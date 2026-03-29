import type { ActiveSection, PaymentBreakdown, UserRole } from "./types";

export type MobileRoleNavItem = {
  section: ActiveSection;
  label: string;
  icon: string;
};

export const allowedSectionsByRole: Record<UserRole, ActiveSection[]> = {
  cashier: ["cashier", "customers"],
  manager: ["products", "reports", "history", "customers"],
  owner: ["reports", "history", "analytics", "users", "customers"]
};

export const defaultSectionByRole: Record<UserRole, ActiveSection> = {
  cashier: "cashier",
  manager: "reports",
  owner: "reports"
};

export const mobileRoleNavByRole: Record<UserRole, MobileRoleNavItem[]> = {
  cashier: [],
  manager: [
    { section: "reports", label: "Home", icon: "home" },
    { section: "history", label: "Riwayat", icon: "history" },
    { section: "products", label: "Stok", icon: "inventory_2" },
    { section: "customers", label: "Pelanggan", icon: "group" }
  ],
  owner: [
    { section: "reports", label: "Home", icon: "home" },
    { section: "history", label: "Riwayat", icon: "history" },
    { section: "analytics", label: "Analytics", icon: "analytics" },
    { section: "users", label: "Pengguna", icon: "groups" },
    { section: "customers", label: "Pelanggan", icon: "group" }
  ]
};

export const getMobileRoleNavGridClass = (itemCount: number) => {
  if (itemCount >= 5) return "mx-auto grid max-w-lg grid-cols-5 gap-1";
  if (itemCount === 4) return "mx-auto grid max-w-md grid-cols-4 gap-2";
  if (itemCount === 3) return "mx-auto grid max-w-md grid-cols-3 gap-2";
  return "mx-auto grid max-w-md grid-cols-2 gap-2";
};

export const emptyPaymentBreakdown: PaymentBreakdown = {
  cash: 0,
  card: 0,
  qris: 0
};
