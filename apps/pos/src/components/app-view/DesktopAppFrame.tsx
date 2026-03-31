import type { AuthenticatedUser } from "../../auth";
import type { UserRole } from "../../types";
import type { DesktopNavItem } from "./types";

type DesktopAppFrameProps = {
  role: UserRole;
  authUser: AuthenticatedUser;
  desktopNavItems: DesktopNavItem[];
  desktopSectionTitle: string;
  checkoutError: string;
  onDesktopNavClick: (item: DesktopNavItem) => void;
  isDesktopNavActive: (item: DesktopNavItem) => boolean;
  onNewSale: () => void;
  notificationCount: number;
  isSettingsOpen: boolean;
  isNotificationsOpen: boolean;
  isHelpOpen: boolean;
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
  onHelpClick: () => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function DesktopAppFrame({
  role,
  authUser,
  desktopNavItems,
  desktopSectionTitle,
  checkoutError,
  onDesktopNavClick,
  isDesktopNavActive,
  onNewSale,
  notificationCount,
  isSettingsOpen,
  isNotificationsOpen,
  isHelpOpen,
  onSettingsClick,
  onNotificationsClick,
  onHelpClick,
  onLogout,
  children
}: DesktopAppFrameProps) {
  return (
    <div className="hidden lg:flex">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-100 py-6">
        <div className="mb-8 px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <div>
              <p className="font-headline text-lg font-extrabold leading-tight text-cyan-950">
                {role === "cashier" ? "Main Terminal" : authUser.tenantName}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                {role === "cashier" ? "Precision Architect Mode" : `Terminal ${authUser.tenantCode}`}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {desktopNavItems.map((item) => {
            const active = isDesktopNavActive(item);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onDesktopNavClick(item)}
                className={
                  active
                    ? "mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm"
                    : "mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-slate-200/60 hover:text-primary"
                }
              >
                <span className="material-symbols-outlined text-[20px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {role === "cashier" && (
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={onNewSale}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              New Sale
            </button>
          </div>
        )}

        <div className="border-t border-outline-variant/40 pt-3">
          <button
            type="button"
            onClick={onSettingsClick}
            className={
              isSettingsOpen
                ? "mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm"
                : "mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-slate-200/60"
            }
          >
            <span className="material-symbols-outlined text-[20px]" style={isSettingsOpen ? { fontVariationSettings: "'FILL' 1" } : undefined}>settings</span>
            Settings
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/10"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-outline-variant/30 bg-slate-50/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-8 py-3">
            <div className="flex min-w-0 items-center gap-6">
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Merchant Pro</h1>
              <p className="truncate font-headline text-lg font-bold text-on-surface">{desktopSectionTitle}</p>
              <div className="relative hidden xl:block">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search products, reports, or transactions..."
                  className="h-10 w-80 rounded-xl border-none bg-surface-container-low pl-10 pr-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {role !== "cashier" && (
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                  {role === "owner" ? "Owner View" : "Manager View"}
                </span>
              )}
              <button
                type="button"
                onClick={onNotificationsClick}
                className={
                  isNotificationsOpen
                    ? "relative grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"
                    : "relative grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-slate-200/70"
                }
                aria-label="Notifikasi"
                title="Notifikasi"
              >
                <span className="material-symbols-outlined text-[20px]" style={isNotificationsOpen ? { fontVariationSettings: "'FILL' 1" } : undefined}>notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-error px-1 text-[9px] font-bold leading-none text-on-error">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onHelpClick}
                className={
                  isHelpOpen
                    ? "grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary"
                    : "grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-slate-200/70"
                }
                aria-label="Bantuan"
                title="Bantuan"
              >
                <span className="material-symbols-outlined text-[20px]" style={isHelpOpen ? { fontVariationSettings: "'FILL' 1" } : undefined}>help</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-outline-variant/40 bg-surface-container-highest text-xs font-bold text-primary"
                aria-label="Keluar"
                title="Keluar"
              >
                {(authUser.fullName || "U").trim().charAt(0).toUpperCase()}
              </button>
            </div>
          </div>

          {checkoutError && (
            <div className="border-t border-outline-variant/30 px-8 py-2">
              <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
                {checkoutError}
              </p>
            </div>
          )}
        </header>

        <section className="flex-1 overflow-y-auto px-8 pb-8 pt-6">
          {children}
        </section>
      </div>
    </div>
  );
}
