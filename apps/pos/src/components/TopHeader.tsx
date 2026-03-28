import type { ActiveSection, UserRole } from "../types";

type TopHeaderProps = {
  isOnline: boolean;
  pendingSales: number;
  isSyncing: boolean;
  cartItemCount: number;
  total: number;
  todayRevenue: number;
  lowStockCount: number;
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
  isOnline,
  pendingSales,
  isSyncing,
  cartItemCount,
  total,
  todayRevenue,
  lowStockCount,
  outOfStockCount,
  checkoutError,
  role,
  section,
  userName,
  tenantName,
  tenantCode,
  joinCode,
  onLogout,
  onSectionChange
}: TopHeaderProps) {
  const hasOwnerAccess = role === "owner";
  const roleLabel = role === "owner" ? "Owner" : role === "manager" ? "Manager" : "Kasir";
  const navItems: Array<{ section: ActiveSection; label: string; icon: string }> =
    role === "owner"
      ? [
          { section: "reports", label: "Ringkasan", icon: "analytics" },
          { section: "users", label: "Pengguna", icon: "groups" }
        ]
      : role === "manager"
        ? [
            { section: "products", label: "Stok", icon: "inventory_2" },
            { section: "reports", label: "Ringkasan", icon: "analytics" }
          ]
        : [];

  const dayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date());

  const showCommerceStats = role !== "cashier";

  return (
    <header className="sticky top-0 z-40 rounded-3xl border border-outline-variant/40 glass-surface enter-fade-up shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">storefront</span>
          <div className="min-w-0">
            <p className="truncate font-headline text-lg font-extrabold tracking-tight text-primary leading-none sm:text-2xl">{tenantName}</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{tenantCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface-container-low text-primary transition hover:bg-surface-container-high tap-bounce"
            aria-label="Cari"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="h-10 rounded-xl bg-primary px-3 text-xs font-semibold uppercase tracking-wide text-on-primary transition hover:brightness-105 tap-bounce"
          >
            Keluar
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">{dayLabel}</p>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
              {role === "cashier" ? "Transaksi Aktif" : "Ringkasan Toko"}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-on-surface-variant">{userName} • {roleLabel}</p>
          </div>
          <span
            className={isOnline ? "rounded-full bg-secondary-container px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-on-secondary-container" : "rounded-full bg-error-container px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-on-error-container"}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold text-on-surface-variant">
            Pending Sync: {pendingSales}
          </span>
          {isSyncing && (
            <span className="rounded-full bg-primary-fixed px-2.5 py-1 font-semibold text-on-primary-fixed-variant">
              Sinkronisasi...
            </span>
          )}
          {hasOwnerAccess && joinCode && (
            <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 font-semibold text-on-tertiary-fixed-variant">
              Kode Join: {joinCode}
            </span>
          )}
        </div>

        {showCommerceStats && (
          <div className="grid grid-cols-1 gap-2 text-xs sm:max-w-xl sm:grid-cols-3">
            <div className="rounded-xl bg-surface-container-low px-3 py-2">
              <p className="text-on-surface-variant">Item</p>
              <p className="font-headline text-base font-bold text-on-surface">{cartItemCount}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-3 py-2">
              <p className="text-on-surface-variant">Total</p>
              <p className="font-headline text-sm font-bold text-on-surface sm:text-base">Rp {total.toLocaleString("id-ID")}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low px-3 py-2">
              <p className="text-on-surface-variant">Hari Ini</p>
              <p className="font-headline text-sm font-bold text-on-surface sm:text-base">Rp {todayRevenue.toLocaleString("id-ID")}</p>
            </div>
          </div>
        )}

        {showCommerceStats && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 font-semibold text-on-tertiary-fixed-variant">
              Stok menipis: {lowStockCount}
            </span>
            <span className="rounded-full bg-error-container px-2.5 py-1 font-semibold text-on-error-container">
              Stok habis: {outOfStockCount}
            </span>
          </div>
        )}

        {navItems.length > 0 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => onSectionChange(item.section)}
                className={section === item.section ? "flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold uppercase tracking-wide text-on-primary tap-bounce" : "flex h-10 items-center gap-1.5 rounded-full bg-surface-container-high px-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant tap-bounce"}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {checkoutError && (
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container sm:text-sm">
            {checkoutError}
          </p>
        )}
      </div>
    </header>
  );
}
