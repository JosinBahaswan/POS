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
import type {
  ActiveSection,
  CartItem,
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
  mobileRoleNavItems: MobileRoleNavItem[];
  mobileRoleNavGridClass: string;
  isOnline: boolean;
  pendingSales: number;
  isSyncing: boolean;
  cartItemCount: number;
  total: number;
  todayRevenue: number;
  lowStockCount: number;
  outOfStockCount: number;
  checkoutError: string;
  productCatalog: ProductItem[];
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
  mobileRoleNavItems,
  mobileRoleNavGridClass,
  isOnline,
  pendingSales,
  isSyncing,
  cartItemCount,
  total,
  todayRevenue,
  lowStockCount,
  outOfStockCount,
  checkoutError,
  productCatalog,
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
  onSectionChange,
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
  onRefreshManagedUsers,
  onCreateManagedUser,
  onUpdateManagedUser,
  onCloseCheckoutConfirm,
  onConfirmCheckout
}: AppViewProps) {
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
        outOfStockCount={outOfStockCount}
        checkoutError={checkoutError}
        role={role}
        section={activeSection}
        userName={authUser.fullName}
        tenantName={authUser.tenantName}
        tenantCode={authUser.tenantCode}
        joinCode={hasOwnerAccess ? authUser.joinCode : undefined}
        onLogout={onLogout}
        onSectionChange={onSectionChange}
      />

      <div className="mx-auto w-full max-w-7xl px-3 pb-3 pt-[calc(5rem+env(safe-area-inset-top))] sm:px-0 sm:pb-0">
        {role !== "cashier" && mobileRoleNavItems.length > 0 && (
          <nav className="mb-3 hidden lg:block">
            <div className="inline-flex rounded-2xl border border-outline-variant/40 bg-white/90 p-1 backdrop-blur">
              {mobileRoleNavItems.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => onSectionChange(item.section)}
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
            </div>
          </nav>
        )}

        <div className={role === "cashier" ? "" : "pb-24 lg:pb-0"}>
          {activeSection === "cashier" && (
            <CashierPage
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
            <ProductsPage products={productCatalog} onUpsert={onUpsertProduct} onDelete={onDeleteProduct} />
          )}

          {hasReportsAccess && activeSection === "reports" && (
            <ReportsPage
              sales={allSales}
              role={role}
              shifts={shiftSessions}
              approvalRequests={approvalRequests}
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
              onUpdateApprovalRules={onUpdateApprovalRules}
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

      {role !== "cashier" && mobileRoleNavItems.length > 0 && activeSection !== "cashier" && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-white/90 px-3 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden">
          <div className={mobileRoleNavGridClass}>
            {mobileRoleNavItems.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => onSectionChange(item.section)}
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
          </div>
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
