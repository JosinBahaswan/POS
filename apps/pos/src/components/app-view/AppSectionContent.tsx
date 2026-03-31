import type { ApprovalDecision, ApprovalRequest, ApprovalRules } from "../../approvals";
import type { AuditLogEntry } from "../../auditLog";
import type { ManagedUser, ManagedUserRole } from "../../auth";
import type { ProductItem } from "../../localData";
import type { ManagerSystemSettings, ManagerSystemSettingsInput } from "../../managerSettings";
import { CashierPage } from "../../pages/CashierPage";
import CustomersPage from "../../pages/CustomersPage";
import { OwnerAnalyticsPage } from "../../pages/OwnerAnalyticsPage";
import { ProductsPage } from "../../pages/ProductsPage";
import { ReportsPage } from "../../pages/ReportsPage";
import { UsersPage } from "../../pages/UsersPage";
import type {
  ActiveSection,
  CartItem,
  Customer,
  PaymentBreakdown,
  PaymentMethod,
  UserRole
} from "../../types";
import type { LocalSale } from "../../database";
import type { ShiftSession, CashMovementType } from "../../shift";
import { SalesHistory } from "../SalesHistory";
import type { HeldOrder } from "../HoldOrdersBar";

type AppSectionContentProps = {
  layout: "mobile" | "desktop";
  storageScopeKey: string;
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
  productCatalog: ProductItem[];
  customers: Customer[];
  selectedCustomerId?: string;
  selectedCustomerLoyaltyPoints: number;
  selectedCustomerMemberTier?: Customer["member_tier"];
  selectedCustomerLoyaltyMultiplier: number;
  estimatedEarnedPoints: number;
  selectedCustomerOutstandingDebt: number;
  loyaltyPointValue: number;
  redeemedPoints: number;
  loyaltyRedeemAmount: number;
  maxRedeemablePoints: number;
  onSelectCustomer: (id: string | undefined) => void;
  onRedeemedPointsChange: (value: number) => void;
  heldOrders: HeldOrder[];
  pendingCartDraftSummary: {
    updatedAt: string;
    itemCount: number;
    subtotal: number;
  } | null;
  allSales: LocalSale[];
  cart: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  isSplitPayment: boolean;
  splitPayment: PaymentBreakdown;
  cashReceived: number;
  changeAmount: number;
  activeShift: ShiftSession | null;
  shiftExpectedClosingCash: number | null;
  shiftCashSalesTotal: number;
  shiftVarianceThreshold: number;
  recentShiftHistory: ShiftSession[];
  shiftSessions: ShiftSession[];
  approvalRequests: ApprovalRequest[];
  managedUsers: ManagedUser[];
  usersLoading: boolean;
  usersError: string;
  approvalRules: ApprovalRules;
  auditLogs: AuditLogEntry[];
  isSyncing: boolean;
  cartEstimatedCost: number;
  cartGrossProfit: number;
  cartGrossMarginPercent: number | null;
  cartHasNegativeMargin: boolean;
  cartProjectedLossAmount: number;
  discountApprovalThreshold: number;
  cartMinimumMarginThreshold: number;
  cartBelowMinimumMarginThreshold: boolean;
  onAddItem: (id: string, name: string, price: number) => void;
  onDiscountChange: (value: number) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onSplitPaymentToggle: (enabled: boolean) => void;
  onSplitPaymentAmountChange: (method: PaymentMethod, value: number) => void;
  onApplySplitPaymentPreset: (next: PaymentBreakdown) => void;
  onCashReceivedChange: (value: number) => void;
  onOpenShift: (openingCash: number) => void;
  onCloseShift: (closingCash: number, note: string) => void;
  onAddCashMovement: (type: CashMovementType, amount: number, note: string) => void;
  onIncreaseQty: (id: string) => void;
  onDecreaseQty: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onHoldOrder: () => void;
  onResumeOrder: (id: string) => void;
  onDiscardHoldOrder: (id: string) => void;
  onDiscardExpiredHoldOrders: () => void;
  onClearAllHoldOrders: () => void;
  onRestoreCartDraft: () => void;
  onDiscardCartDraft: () => void;
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
    minimumMarginPercentThreshold: number;
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
  onCreateCustomer: (input: {
    name: string;
    phone?: string;
    email?: string;
    memberTier?: Customer["member_tier"];
  }) => void;
  onUpdateCustomerTier: (customerId: string, tier: Customer["member_tier"]) => void;
  onSettleCustomerDebt: (customerId: string) => void;
};

export function AppSectionContent({
  layout,
  storageScopeKey,
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
  productCatalog,
  customers,
  selectedCustomerId,
  selectedCustomerLoyaltyPoints,
  selectedCustomerMemberTier,
  selectedCustomerLoyaltyMultiplier,
  estimatedEarnedPoints,
  selectedCustomerOutstandingDebt,
  loyaltyPointValue,
  redeemedPoints,
  loyaltyRedeemAmount,
  maxRedeemablePoints,
  onSelectCustomer,
  onRedeemedPointsChange,
  heldOrders,
  pendingCartDraftSummary,
  allSales,
  cart,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  paymentMethod,
  isSplitPayment,
  splitPayment,
  cashReceived,
  changeAmount,
  activeShift,
  shiftExpectedClosingCash,
  shiftCashSalesTotal,
  shiftVarianceThreshold,
  recentShiftHistory,
  shiftSessions,
  approvalRequests,
  managedUsers,
  usersLoading,
  usersError,
  approvalRules,
  auditLogs,
  isSyncing,
  cartEstimatedCost,
  cartGrossProfit,
  cartGrossMarginPercent,
  cartHasNegativeMargin,
  cartProjectedLossAmount,
  discountApprovalThreshold,
  cartMinimumMarginThreshold,
  cartBelowMinimumMarginThreshold,
  onAddItem,
  onDiscountChange,
  onPaymentMethodChange,
  onSplitPaymentToggle,
  onSplitPaymentAmountChange,
  onApplySplitPaymentPreset,
  onCashReceivedChange,
  onOpenShift,
  onCloseShift,
  onAddCashMovement,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onHoldOrder,
  onResumeOrder,
  onDiscardHoldOrder,
  onDiscardExpiredHoldOrders,
  onClearAllHoldOrders,
  onRestoreCartDraft,
  onDiscardCartDraft,
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
  onCreateCustomer,
  onUpdateCustomerTier,
  onSettleCustomerDebt
}: AppSectionContentProps) {
  return (
    <div className={layout === "mobile" && role !== "cashier" ? "pb-24" : ""}>
      {activeSection === "cashier" && (
        <CashierPage
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          selectedCustomerLoyaltyPoints={selectedCustomerLoyaltyPoints}
          selectedCustomerMemberTier={selectedCustomerMemberTier}
          selectedCustomerLoyaltyMultiplier={selectedCustomerLoyaltyMultiplier}
          estimatedEarnedPoints={estimatedEarnedPoints}
          selectedCustomerOutstandingDebt={selectedCustomerOutstandingDebt}
          loyaltyPointValue={loyaltyPointValue}
          redeemedPoints={redeemedPoints}
          loyaltyRedeemAmount={loyaltyRedeemAmount}
          maxRedeemablePoints={maxRedeemablePoints}
          onSelectCustomer={onSelectCustomer}
          onRedeemedPointsChange={onRedeemedPointsChange}
          products={productCatalog}
          heldOrders={heldOrders}
          pendingCartDraftSummary={pendingCartDraftSummary}
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
          shiftExpectedClosingCash={shiftExpectedClosingCash}
          shiftCashSalesTotal={shiftCashSalesTotal}
          shiftVarianceThreshold={shiftVarianceThreshold}
          recentShiftHistory={recentShiftHistory}
          isSyncing={isSyncing}
          cartEstimatedCost={cartEstimatedCost}
          cartGrossProfit={cartGrossProfit}
          cartGrossMarginPercent={cartGrossMarginPercent}
          cartHasNegativeMargin={cartHasNegativeMargin}
          cartProjectedLossAmount={cartProjectedLossAmount}
          discountApprovalThreshold={discountApprovalThreshold}
          cartMinimumMarginThreshold={cartMinimumMarginThreshold}
          cartBelowMinimumMarginThreshold={cartBelowMinimumMarginThreshold}
          onAddItem={onAddItem}
          onDiscountChange={onDiscountChange}
          onPaymentMethodChange={onPaymentMethodChange}
          onSplitPaymentToggle={onSplitPaymentToggle}
          onSplitPaymentAmountChange={onSplitPaymentAmountChange}
          onApplySplitPaymentPreset={onApplySplitPaymentPreset}
          onCashReceivedChange={onCashReceivedChange}
          onOpenShift={onOpenShift}
          onCloseShift={onCloseShift}
          onAddCashMovement={onAddCashMovement}
          onIncreaseQty={onIncreaseQty}
          onDecreaseQty={onDecreaseQty}
          onRemoveItem={onRemoveItem}
          onHoldOrder={onHoldOrder}
          onResumeOrder={onResumeOrder}
          onDiscardHoldOrder={onDiscardHoldOrder}
          onDiscardExpiredHoldOrders={onDiscardExpiredHoldOrders}
          onClearAllHoldOrders={onClearAllHoldOrders}
          onRestoreCartDraft={onRestoreCartDraft}
          onDiscardCartDraft={onDiscardCartDraft}
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
        <section className={layout === "mobile" ? "mt-4 grid gap-3" : "mt-2 grid gap-3"}>
          {layout === "mobile" && (
            <div className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Riwayat Transaksi</p>
              <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">Semua Aktivitas Kasir</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Detail, cetak struk, refund, dan void tersedia di halaman ini agar Home tetap ringkas.</p>
            </div>
          )}
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
          shifts={shiftSessions}
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
        <CustomersPage
          storageScopeKey={storageScopeKey}
          customers={customers}
          sales={allSales}
          onCreateCustomer={onCreateCustomer}
          onUpdateCustomerTier={onUpdateCustomerTier}
          onSettleCustomerDebt={onSettleCustomerDebt}
        />
      )}
    </div>
  );
}
