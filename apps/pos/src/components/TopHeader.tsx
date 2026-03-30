import type { ActiveSection, UserRole } from "../types";
import type { ProductItem } from "../localData";
import { LowStockNotificationWidget } from "./LowStockNotificationWidget";

type TopHeaderProps = {
  isOnline: boolean;
  pendingSales: number;
  isSyncing: boolean;
  cartItemCount: number;
  total: number;
  todayRevenue: number;
  lowStockCount: number;
  lowStockItems: ProductItem[];
  outOfStockCount: number;
  checkoutError: string;
  role: UserRole;
  section: ActiveSection;
  userName: string;
  tenantName: string;
  tenantCode: string;
  joinCode?: string;
  onLogout: () => void;
  onSectionChange: (section: ActiveSection) => void;
};

export function TopHeader({
  checkoutError,
  role,
  section,
  userName,
  tenantName,
  lowStockItems,
  onLogout,
  onSectionChange
}: TopHeaderProps) {
  const title = tenantName || "POS";
  const avatarLabel = (userName || "U").trim().charAt(0).toUpperCase();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-outline-variant/30 bg-white/80 shadow-sm shadow-teal-900/5 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="material-symbols-outlined text-primary">storefront</span>
          <p className="truncate font-headline text-base font-extrabold tracking-tight text-primary sm:text-xl">{title}</p>
        </div>

        <div className="flex items-center gap-3">            {lowStockItems && lowStockItems.length > 0 && role !== "cashier" && (
              <LowStockNotificationWidget lowStockItems={lowStockItems} />
            )}          {role !== "cashier" && section === "cashier" && (
            <button
              type="button"
              onClick={() => onSectionChange(role === "owner" ? "analytics" : "reports")}
              className="flex h-8 items-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition tap-bounce lg:hidden"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Menu
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container-highest text-xs font-bold text-primary transition hover:brightness-95 tap-bounce"
            aria-label="Keluar"
            title="Keluar"
          >
            {avatarLabel}
          </button>
        </div>
      </div>

      {checkoutError && (
        <div className="border-t border-outline-variant/30 px-4 py-2 sm:px-5">
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container sm:text-sm">
            {checkoutError}
          </p>
        </div>
      )}
    </header>
  );
}
