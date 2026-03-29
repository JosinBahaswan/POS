import type { ActiveSection, PaymentBreakdown, UserRole } from "./types";

export type MobileRoleNavItem = {
  section: ActiveSection;
  label: string;
  icon: string;
};

export const allowedSectionsByRole: Record<UserRole, ActiveSection[]> = {
  cashier: ["cashier"],
  manager: ["products", "reports", "history"],
  owner: ["reports", "history", "analytics", "users"]
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
    { section: "products", label: "Stok", icon: "inventory_2" }
  ],
  owner: [
    { section: "reports", label: "Home", icon: "home" },
    { section: "history", label: "Riwayat", icon: "history" },
    { section: "analytics", label: "Analytics", icon: "analytics" },
    { section: "users", label: "Pengguna", icon: "groups" }
  ]
};

export const getMobileRoleNavGridClass = (itemCount: number) => {
  if (itemCount >= 4) return "mx-auto grid max-w-md grid-cols-4 gap-2";
  if (itemCount === 3) return "mx-auto grid max-w-md grid-cols-3 gap-2";
  return "mx-auto grid max-w-md grid-cols-2 gap-2";
};

export const emptyPaymentBreakdown: PaymentBreakdown = {
  cash: 0,
  card: 0,
  qris: 0
};
