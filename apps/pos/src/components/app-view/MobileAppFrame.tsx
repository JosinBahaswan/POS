import type { AuthenticatedUser } from "../../auth";
import type { ProductItem } from "../../localData";
import type { ActiveSection, UserRole } from "../../types";
import { TopHeader } from "../TopHeader";
import type { MobileRoleNavItem } from "./types";

type MobileAppFrameProps = {
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
  activeSection: ActiveSection;
  authUser: AuthenticatedUser;
  hasOwnerAccess: boolean;
  primaryNavItems: MobileRoleNavItem[];
  overflowNavItems: MobileRoleNavItem[];
  mobileNavGridClass: string;
  isOwnerMoreOpen: boolean;
  isOverflowSectionActive: boolean;
  onToggleOwnerMore: () => void;
  onSectionSelect: (section: ActiveSection) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function MobileAppFrame({
  isOnline,
  pendingSales,
  isSyncing,
  cartItemCount,
  total,
  todayRevenue,
  lowStockCount,
  lowStockItems,
  outOfStockCount,
  checkoutError,
  role,
  activeSection,
  authUser,
  hasOwnerAccess,
  primaryNavItems,
  overflowNavItems,
  mobileNavGridClass,
  isOwnerMoreOpen,
  isOverflowSectionActive,
  onToggleOwnerMore,
  onSectionSelect,
  onLogout,
  children
}: MobileAppFrameProps) {
  return (
    <div className="lg:hidden">
      <main className="min-h-screen bg-background px-0 py-0 sm:px-4 sm:py-4">
        <TopHeader
          isOnline={isOnline}
          pendingSales={pendingSales}
          isSyncing={isSyncing}
          cartItemCount={cartItemCount}
          total={total}
          todayRevenue={todayRevenue}
          lowStockCount={lowStockCount}
          lowStockItems={lowStockItems}
          outOfStockCount={outOfStockCount}
          checkoutError={checkoutError}
          role={role}
          section={activeSection}
          userName={authUser.fullName}
          tenantName={authUser.tenantName}
          tenantCode={authUser.tenantCode}
          joinCode={hasOwnerAccess ? authUser.joinCode : undefined}
          onLogout={onLogout}
          onSectionChange={onSectionSelect}
        />

        <div className="mx-auto w-full max-w-7xl px-3 pb-3 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-0 sm:pb-0">
          {children}
        </div>

        {role !== "cashier" && primaryNavItems.length > 0 && activeSection !== "cashier" && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-white/90 px-3 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden">
            <div className={mobileNavGridClass}>
              {primaryNavItems.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => onSectionSelect(item.section)}
                  className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-12 transition-colors duration-200 ${activeSection === item.section ? "text-primary" : "text-on-surface-variant"}`}
                >
                  <div className={`flex w-16 h-8 items-center justify-center rounded-full transition-all duration-300 ${activeSection === item.section ? "bg-primary/15" : "bg-transparent"}`}>
                    <span
                      className="material-symbols-outlined text-[20px] transition-transform"
                      style={activeSection === item.section ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-[0.12em] ${activeSection === item.section ? "font-bold" : "font-medium"}`}>{item.label}</span>
                </button>
              ))}

              {overflowNavItems.length > 0 && (
                <button
                  type="button"
                  onClick={onToggleOwnerMore}
                  className={`flex h-12 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors duration-200 ${isOwnerMoreOpen || isOverflowSectionActive ? "text-primary" : "text-on-surface-variant"}`}
                  aria-expanded={isOwnerMoreOpen}
                  aria-label="Menu owner lainnya"
                >
                  <div className={`flex h-8 w-16 items-center justify-center rounded-full transition-all duration-300 ${isOwnerMoreOpen || isOverflowSectionActive ? "bg-primary/15" : "bg-transparent"}`}>
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-[0.12em] ${isOwnerMoreOpen || isOverflowSectionActive ? "font-bold" : "font-medium"}`}>Lainnya</span>
                </button>
              )}
            </div>

            {isOwnerMoreOpen && overflowNavItems.length > 0 && (
              <div className="absolute bottom-[calc(100%+0.5rem)] left-3 right-3 rounded-2xl border border-outline-variant/40 bg-white/95 p-2 shadow-lg backdrop-blur-2xl">
                <div className="grid grid-cols-1 gap-1">
                  {overflowNavItems.map((item) => (
                    <button
                      key={item.section}
                      type="button"
                      onClick={() => onSectionSelect(item.section)}
                      className={
                        activeSection === item.section
                          ? "inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold uppercase tracking-[0.12em] text-on-primary"
                          : "inline-flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant hover:bg-surface-container-low"
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
