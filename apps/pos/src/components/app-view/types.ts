import type { ActiveSection } from "../../types";

export type MobileRoleNavItem = {
  section: ActiveSection;
  label: string;
  icon: string;
};

export type DesktopNavItem = {
  key: string;
  label: string;
  icon: string;
  section?: ActiveSection;
  cashierHash?: "home" | "products" | "cart" | "history";
};
