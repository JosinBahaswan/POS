import { useState } from "react";
import { CheckoutConfirmModal } from "./CheckoutConfirmModal";
import type { HeldOrder } from "./HoldOrdersBar";
import { TopHeader } from "./TopHeader";
import type { ApprovalDecision, ApprovalRequest, ApprovalRules } from "../approvals";
import type { AuditLogEntry } from "../auditLog";
import type { ManagedUser, ManagedUserRole, AuthenticatedUser } from "../auth";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import { CashierPage } from "../pages/CashierPage";
import { OwnerAnalyticsPage } from "../pages/OwnerAnalyticsPage";
import { ProductsPage } from "../pages/ProductsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { UsersPage } from "../pages/UsersPage";
import CustomersPage from "../pages/CustomersPage";
import { SalesHistory } from "./SalesHistory";
import type { ManagerSystemSettings, ManagerSystemSettingsInput } from "../managerSettings";
import type {
  ActiveSection,
  CartItem,
  Customer,
  PaymentBreakdown,
  PaymentMethod,
  UserRole
} from "../types";
import type { CashMovementType, ShiftSession } from "../shift";

type MobileRoleNavItem = {
  section: ActiveSection;
  label: string;
  icon: string;
};

export type AppViewProps = {
  authUser: AuthenticatedUser;
  role: UserRole;
  activeSection: ActiveSection;
  hasProductAccess: boolean;
  hasReportsAccess: boolean;
  hasAnalyticsAccess: boolean;
  hasOwnerAccess: boolean;
  hasCustomersAccess: boolean;
  managerSettings: ManagerSystemSettings;
  managerCanExportData: boolean;
  managerCanResolveApproval: boolean;
  managerCanDeleteProduct: boolean;
  managerCanAdjustStock: boolean;
  mobileRoleNavItems: MobileRoleNavItem[];
  mobileRoleNavGridClass: string;
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
  productCatalog: ProductItem[];
  customers: Customer[];
  selectedCustomerId?: string;
  onSelectCustomer: (id: string | undefined) => void;
  heldOrders: HeldOrder[];
  allSales: LocalSale[];
  cart: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  paymentMethod: PaymentMethod;
  isSplitPayment: boolean;
  splitPayment: PaymentBreakdown;
  cashReceived: number;
  changeAmount: number;
  activeShift: ShiftSession | null;
  recentShiftHistory: ShiftSession[];
  shiftSessions: ShiftSession[];
  approvalRequests: ApprovalRequest[];
  managedUsers: ManagedUser[];
  usersLoading: boolean;
  usersError: string;
  approvalRules: ApprovalRules;
  auditLogs: AuditLogEntry[];
  showCheckoutConfirm: boolean;
  onSectionChange: (section: ActiveSection) => void;
  onLogout: () => void;
  onAddItem: (id: string, name: string, price: number) => void;
  onDiscountChange: (value: number) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onSplitPaymentToggle: (enabled: boolean) => void;
  onSplitPaymentAmountChange: (method: PaymentMethod, value: number) => void;
  onCashReceivedChange: (value: number) => void;
  onOpenShift: (openingCash: number) => void;
  onCloseShift: (closingCash: number, note: string) => void;
  onAddCashMovement: (type: CashMovementType, amount: number, note: string) => void;
  onIncreaseQty: (id: string) => void;
  onDecreaseQty: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onHoldOrder: () => void;
  onResumeOrder: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  onPrintReceipt: (saleId: string) => void;
  onRequestRefund: (saleId: string, reason: string) => void;
  onRequestVoid: (saleId: string, reason: string) => void;
  onUpsertProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onResolveApprovalRequest: (requestId: string, decision: ApprovalDecision, note: string) => Promise<void>;
  onUpdateApprovalRules: (input: {
    largeDiscountPercentThreshold: number;
    requireRefundApproval: boolean;
    requireVoidApproval: boolean;
  }) => void;
  onUpdateManagerSettings: (input: ManagerSystemSettingsInput) => void;
  onRefreshManagedUsers: () => void;
  onCreateManagedUser: (input: {
    email: string;
    password: string;
    fullName: string;
    role: ManagedUserRole;
  }) => Promise<void>;
  onUpdateManagedUser: (input: {
    userId: string;
    role?: ManagedUserRole;
    isActive?: boolean;
    fullName?: string;
  }) => Promise<void>;
  onCloseCheckoutConfirm: () => void;
  onConfirmCheckout: () => void;
};

export function AppView({
  authUser,
  role,
  activeSection,
  hasProductAccess,
  hasReportsAccess,
  hasAnalyticsAccess,
  hasOwnerAccess,
  hasCustomersAccess,
  managerSettings,
  managerCanExportData,
  managerCanResolveApproval,
  managerCanDeleteProduct,
  managerCanAdjustStock,
  mobileRoleNavItems,
  mobileRoleNavGridClass,
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
  productCatalog,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  heldOrders,
  allSales,
  cart,
  subtotal,
  discountPercent,
  discountAmount,
  paymentMethod,
  isSplitPayment,
  splitPayment,
  cashReceived,
  changeAmount,
  activeShift,
  recentShiftHistory,
  shiftSessions,
  approvalRequests,
  managedUsers,
  usersLoading,
  usersError,
  approvalRules,
  auditLogs,
  showCheckoutConfirm,
  onSectionChange: onSectionChangeProp,
  onLogout,
  onAddItem,
  onDiscountChange,
  onPaymentMethodChange,
  onSplitPaymentToggle,
  onSplitPaymentAmountChange,
  onCashReceivedChange,
  onOpenShift,
  onCloseShift,
  onAddCashMovement,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onHoldOrder,
  onResumeOrder,
  onClear,
  onCheckout,
  onPrintReceipt,
  onRequestRefund,
  onRequestVoid,
  onUpsertProduct,
  onDeleteProduct,
  onResolveApprovalRequest,
  onUpdateApprovalRules,
  onUpdateManagerSettings,
  onRefreshManagedUsers,
  onCreateManagedUser,
  onUpdateManagedUser,
  onCloseCheckoutConfirm,
  onConfirmCheckout
}: AppViewProps) {
  const [isOwnerMoreOpen, setIsOwnerMoreOpen] = useState(false);
  const ownerPrimarySections: ActiveSection[] = ["reports", "history", "analytics"];
  const isOwner = role === "owner";
  const primaryNavItems = isOwner
    ? mobileRoleNavItems.filter((item) => ownerPrimarySections.includes(item.section))
    : mobileRoleNavItems;
  const overflowNavItems = isOwner
    ? mobileRoleNavItems.filter((item) => !ownerPrimarySections.includes(item.section))
    : [];
  const isOverflowSectionActive = overflowNavItems.some((item) => item.section === activeSection);
  const mobileNavGridClass =
    isOwner && overflowNavItems.length > 0
      ? "mx-auto grid max-w-md grid-cols-4 gap-2"
      : mobileRoleNavGridClass;

  const handleSectionSelect = (section: ActiveSection) => {
    onSectionChangeProp(section);
    setIsOwnerMoreOpen(false);
  };

  return (
    <main className="min-h-screen bg-background px-0 py-0 sm:px-4 sm:py-4 lg:px-6">
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
        onSectionChange={handleSectionSelect}
      />

      <div className="mx-auto w-full max-w-7xl px-3 pb-3 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-0 sm:pb-0">
        {role !== "cashier" && primaryNavItems.length > 0 && (
          <nav className="relative mb-3 hidden lg:block">
            <div className="inline-flex rounded-2xl border border-outline-variant/40 bg-white/90 p-1 backdrop-blur">
              {primaryNavItems.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => handleSectionSelect(item.section)}
                  className={
                    activeSection === item.section
                      ? "inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold uppercase tracking-[0.14em] text-on-primary"
                      : "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant"
                  }
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}

              {overflowNavItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsOwnerMoreOpen((current) => !current)}
                  className={
                    isOwnerMoreOpen || isOverflowSectionActive
                      ? "inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold uppercase tracking-[0.14em] text-on-primary"
                      : "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant"
                  }
                  aria-expanded={isOwnerMoreOpen}
                  aria-label="Menu owner lainnya"
                >
                  <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                  Lainnya
                </button>
              )}
            </div>

            {isOwnerMoreOpen && overflowNavItems.length > 0 && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-2xl border border-outline-variant/40 bg-white/95 p-2 shadow-lg backdrop-blur">
                {overflowNavItems.map((item) => (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => handleSectionSelect(item.section)}
                    className={
                      activeSection === item.section
                        ? "mb-1 inline-flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-on-primary last:mb-0"
                        : "mb-1 inline-flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant hover:bg-surface-container-low last:mb-0"
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        )}

        <div className={role === "cashier" ? "" : "pb-24 lg:pb-0"}>
          {activeSection === "cashier" && (
            <CashierPage customers={customers} selectedCustomerId={selectedCustomerId} onSelectCustomer={onSelectCustomer}
              products={productCatalog}
              heldOrders={heldOrders}
              sales={allSales}
              cart={cart}
              subtotal={subtotal}
              discountPercent={discountPercent}
              discountAmount={discountAmount}
              total={total}
              paymentMethod={paymentMethod}
              isSplitPayment={isSplitPayment}
              splitPayment={splitPayment}
              cashReceived={cashReceived}
              changeAmount={changeAmount}
              activeShift={activeShift}
              recentShiftHistory={recentShiftHistory}
              isSyncing={isSyncing}
              onAddItem={onAddItem}
              onDiscountChange={onDiscountChange}
              onPaymentMethodChange={onPaymentMethodChange}
              onSplitPaymentToggle={onSplitPaymentToggle}
              onSplitPaymentAmountChange={onSplitPaymentAmountChange}
              onCashReceivedChange={onCashReceivedChange}
              onOpenShift={onOpenShift}
              onCloseShift={onCloseShift}
              onAddCashMovement={onAddCashMovement}
              onIncreaseQty={onIncreaseQty}
              onDecreaseQty={onDecreaseQty}
              onRemoveItem={onRemoveItem}
              onHoldOrder={onHoldOrder}
              onResumeOrder={onResumeOrder}
              onClear={onClear}
              onCheckout={onCheckout}
              onPrintReceipt={onPrintReceipt}
              onRequestRefund={onRequestRefund}
              onRequestVoid={onRequestVoid}
            />
          )}

          {hasProductAccess && activeSection === "products" && (
            <ProductsPage
              products={productCatalog}
              onUpsert={onUpsertProduct}
              onDelete={onDeleteProduct}
              canDeleteProduct={managerCanDeleteProduct}
              canAdjustStock={managerCanAdjustStock}
            />
          )}

          {hasReportsAccess && activeSection === "reports" && (
            <ReportsPage
              sales={allSales}
              role={role}
              shifts={shiftSessions}
              approvalRequests={approvalRequests}
              products={productCatalog}
              customers={customers}
              managerCanExportData={managerCanExportData}
              managerCanResolveApproval={managerCanResolveApproval}
              onResolveApprovalRequest={onResolveApprovalRequest}
            />
          )}

          {hasReportsAccess && activeSection === "history" && (
            <section className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Riwayat Transaksi</p>
                <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">Semua Aktivitas Kasir</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Detail, cetak struk, refund, dan void tersedia di halaman ini agar Home tetap ringkas.</p>
              </div>
              <SalesHistory
                sales={allSales}
                onPrint={onPrintReceipt}
                onRequestRefund={onRequestRefund}
                onRequestVoid={onRequestVoid}
              />
            </section>
          )}

          {hasAnalyticsAccess && activeSection === "analytics" && (
            <OwnerAnalyticsPage
              sales={allSales}
              products={productCatalog}
              approvalRules={approvalRules}
              auditLogs={auditLogs}
              managerSettings={managerSettings}
              onUpdateApprovalRules={onUpdateApprovalRules}
              onUpdateManagerSettings={onUpdateManagerSettings}
            />
          )}

          {hasOwnerAccess && activeSection === "users" && (
            <UsersPage
              users={managedUsers}
              loading={usersLoading}
              error={usersError}
              onRefresh={onRefreshManagedUsers}
              onCreateUser={onCreateManagedUser}
              onUpdateUser={onUpdateManagedUser}
            />
          )}

          {hasCustomersAccess && activeSection === "customers" && (
            <CustomersPage />
          )}
        </div>
      </div>

      {role !== "cashier" && primaryNavItems.length > 0 && activeSection !== "cashier" && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-white/90 px-3 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden">
          <div className={mobileNavGridClass}>
            {primaryNavItems.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => handleSectionSelect(item.section)}
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
                onClick={() => setIsOwnerMoreOpen((current) => !current)}
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
                    onClick={() => handleSectionSelect(item.section)}
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

      <CheckoutConfirmModal
        open={showCheckoutConfirm}
        itemCount={cart.reduce((acc, item) => acc + item.qty, 0)}
        total={total}
        paymentMethod={paymentMethod}
        isSplitPayment={isSplitPayment}
        paymentBreakdown={isSplitPayment ? splitPayment : undefined}
        loading={isSyncing}
        onClose={onCloseCheckoutConfirm}
        onConfirm={onConfirmCheckout}
      />
    </main>
  );
}
