import { useMemo, useState, useEffect } from "react";
import { ProductGrid } from "../components/ProductGrid";
import { CartPanel } from "../components/CartPanel";
import { SalesHistory } from "../components/SalesHistory";
import { CashierHomePanel } from "../components/CashierHomePanel";
import { CashierShiftPanel } from "../components/CashierShiftPanel";
import { ReportsPanel } from "../components/ReportsPanel";
import { HoldOrdersBar, type HeldOrder } from "../components/HoldOrdersBar";
import type { Customer, CartItem, PaymentBreakdown, PaymentMethod } from "../types";      
import type { ProductItem } from "../localData";
import type { LocalSale } from "../database";
import type { CashMovementType, ShiftSession } from "../shift";

type CashierPageProps = {
  products: ProductItem[];
  customers?: Customer[];
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
  onSelectCustomer?: (id: string | undefined) => void;
  onRedeemedPointsChange: (value: number) => void;
  heldOrders: HeldOrder[];
  pendingCartDraftSummary: {
    updatedAt: string;
    itemCount: number;
    subtotal: number;
  } | null;
  sales: LocalSale[];
  cart: CartItem[];
  subtotal: number;
  discountPercent: number;
  manualDiscountAmount: number;
  autoPromotionDiscountAmount: number;
  appliedAutoDiscountLabels: string[];
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
};

export function CashierPage({
  products,
  customers = [],
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
  sales,
  cart,
  subtotal,
  discountPercent,
  manualDiscountAmount,
  autoPromotionDiscountAmount,
  appliedAutoDiscountLabels,
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
  onRequestVoid
}: CashierPageProps) {
  const [mobileTab, setMobileTabState] = useState<"home" | "products" | "cart" | "history">("home");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "products", "cart", "history"].includes(hash)) {
        setMobileTabState(hash as "home" | "products" | "cart" | "history");
      } else {
        setMobileTabState("home");
      }
    };
    
    // Set initial tab from hash if available
    handleHashChange();
    
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const setMobileTab = (tab: "home" | "products" | "cart" | "history") => {
    window.location.hash = tab;
  };

  const itemCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);
  const todaySalesCount = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return sales.filter(
      (sale) => sale.status === "completed" && new Date(sale.createdAt).getTime() >= startToday
    ).length;
  }, [sales]);
  const todayRevenue = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return sales
      .filter((sale) => sale.status === "completed" && new Date(sale.createdAt).getTime() >= startToday)
      .reduce((acc, sale) => acc + sale.total, 0);
  }, [sales]);

  const stockByProductId = useMemo(() => {
    const lookup: Record<string, number> = {};
    for (const product of products) {
      lookup[product.id] = Math.max(0, Number(product.stock || 0));
    }
    return lookup;
  }, [products]);

  const isShiftOpen = Boolean(activeShift);

  const checkoutApprovalHint = useMemo(() => {
    const requiresDiscountApproval = discountPercent > discountApprovalThreshold;
    const requiresMarginApproval = cartHasNegativeMargin || cartBelowMinimumMarginThreshold;

    if (!requiresDiscountApproval && !requiresMarginApproval) {
      return "";
    }

    if (requiresDiscountApproval && requiresMarginApproval) {
      return `Checkout akan memicu approval manager/owner karena diskon > ${discountApprovalThreshold}% dan margin berisiko.`;
    }

    if (requiresDiscountApproval) {
      return `Checkout akan memicu approval manager/owner karena diskon > ${discountApprovalThreshold}%.`;
    }

    return "Checkout akan memicu approval manager/owner karena margin checkout berisiko.";
  }, [
    discountPercent,
    discountApprovalThreshold,
    cartHasNegativeMargin,
    cartBelowMinimumMarginThreshold
  ]);

  return (
    <section className="mt-3 grid gap-3 pb-36 sm:mt-4 sm:gap-4 sm:pb-32 lg:pb-0">
      {heldOrders.length > 0 && (
        <HoldOrdersBar
          orders={heldOrders}
          onResume={onResumeOrder}
          onRemove={onDiscardHoldOrder}
          onRemoveExpired={onDiscardExpiredHoldOrders}
          onClearAll={onClearAllHoldOrders}
        />
      )}

      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1.8fr)_420px]">
        {mobileTab === "home" && (
          <section className="grid gap-3 lg:col-span-2">
            <CashierHomePanel
              cartItemCount={itemCount}
              heldOrderCount={heldOrders.length}
              todaySalesCount={todaySalesCount}
              todayRevenue={todayRevenue}
            />
            <CashierShiftPanel
              activeShift={activeShift}
              expectedClosingCash={shiftExpectedClosingCash}
              shiftCashSalesTotal={shiftCashSalesTotal}
              varianceThreshold={shiftVarianceThreshold}
              recentShifts={recentShiftHistory}
              onOpenShift={onOpenShift}
              onCloseShift={onCloseShift}
              onAddCashMovement={onAddCashMovement}
            />
            <ReportsPanel sales={sales} />
          </section>
        )}

        {mobileTab === "history" && (
          <section className="lg:col-span-2">
            <SalesHistory
              sales={sales}
              onPrint={onPrintReceipt}
              onRequestRefund={onRequestRefund}
              onRequestVoid={onRequestVoid}
            />
          </section>
        )}

        {mobileTab === "products" && (
          <section className="grid h-[calc(100vh-14rem)] min-h-[36rem] gap-6 lg:col-span-2 lg:grid-cols-[minmax(0,1.8fr)_420px]">
            <section className="min-h-0 overflow-hidden rounded-2xl bg-surface p-4">
              <div className="h-full overflow-y-auto pr-1">
                <ProductGrid products={products} onAdd={onAddItem} />
              </div>
            </section>

            <section className="min-h-0 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
              <div className="h-full overflow-y-auto pr-1">
                <CartPanel customers={customers} selectedCustomerId={selectedCustomerId} onSelectCustomer={onSelectCustomer}
                  selectedCustomerLoyaltyPoints={selectedCustomerLoyaltyPoints}
                  selectedCustomerMemberTier={selectedCustomerMemberTier}
                  selectedCustomerLoyaltyMultiplier={selectedCustomerLoyaltyMultiplier}
                  estimatedEarnedPoints={estimatedEarnedPoints}
                  selectedCustomerOutstandingDebt={selectedCustomerOutstandingDebt}
                  loyaltyPointValue={loyaltyPointValue}
                  redeemedPoints={redeemedPoints}
                  loyaltyRedeemAmount={loyaltyRedeemAmount}
                  maxRedeemablePoints={maxRedeemablePoints}
                  onRedeemedPointsChange={onRedeemedPointsChange}
                  cart={cart}
                  stockByProductId={stockByProductId}
                  pendingDraft={pendingCartDraftSummary}
                  subtotal={subtotal}
                  discountPercent={discountPercent}
                  manualDiscountAmount={manualDiscountAmount}
                  autoPromotionDiscountAmount={autoPromotionDiscountAmount}
                  appliedAutoDiscountLabels={appliedAutoDiscountLabels}
                  discountAmount={discountAmount}
                  total={total}
                  estimatedCost={cartEstimatedCost}
                  grossProfit={cartGrossProfit}
                  grossMarginPercent={cartGrossMarginPercent}
                  hasNegativeMargin={cartHasNegativeMargin}
                  projectedLossAmount={cartProjectedLossAmount}
                  discountApprovalThreshold={discountApprovalThreshold}
                  minimumMarginThreshold={cartMinimumMarginThreshold}
                  isBelowMinimumMarginThreshold={cartBelowMinimumMarginThreshold}
                  isShiftOpen={isShiftOpen}
                  checkoutApprovalHint={checkoutApprovalHint}
                  paymentMethod={paymentMethod}
                  isSplitPayment={isSplitPayment}
                  splitPayment={splitPayment}
                  cashReceived={cashReceived}
                  changeAmount={changeAmount}
                  onDiscountChange={onDiscountChange}
                  onPaymentMethodChange={onPaymentMethodChange}
                  onSplitPaymentToggle={onSplitPaymentToggle}
                  onSplitPaymentAmountChange={onSplitPaymentAmountChange}
                  onApplySplitPaymentPreset={onApplySplitPaymentPreset}
                  onCashReceivedChange={onCashReceivedChange}
                  onIncreaseQty={onIncreaseQty}
                  onDecreaseQty={onDecreaseQty}
                  onRemoveItem={onRemoveItem}
                  onHoldOrder={onHoldOrder}
                  onRestoreDraft={onRestoreCartDraft}
                  onDiscardDraft={onDiscardCartDraft}
                  onClear={onClear}
                  onCheckout={onCheckout}
                  disableCheckout={isSyncing}
                />
              </div>
            </section>
          </section>
        )}

        {mobileTab === "cart" && (
          <section className="lg:col-span-2">
            <div className="mx-auto max-w-xl rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
              <CartPanel customers={customers} selectedCustomerId={selectedCustomerId} onSelectCustomer={onSelectCustomer}
                selectedCustomerLoyaltyPoints={selectedCustomerLoyaltyPoints}
                selectedCustomerMemberTier={selectedCustomerMemberTier}
                selectedCustomerLoyaltyMultiplier={selectedCustomerLoyaltyMultiplier}
                estimatedEarnedPoints={estimatedEarnedPoints}
                selectedCustomerOutstandingDebt={selectedCustomerOutstandingDebt}
                loyaltyPointValue={loyaltyPointValue}
                redeemedPoints={redeemedPoints}
                loyaltyRedeemAmount={loyaltyRedeemAmount}
                maxRedeemablePoints={maxRedeemablePoints}
                onRedeemedPointsChange={onRedeemedPointsChange}
                cart={cart}
                stockByProductId={stockByProductId}
                pendingDraft={pendingCartDraftSummary}
                subtotal={subtotal}
                discountPercent={discountPercent}
                manualDiscountAmount={manualDiscountAmount}
                autoPromotionDiscountAmount={autoPromotionDiscountAmount}
                appliedAutoDiscountLabels={appliedAutoDiscountLabels}
                discountAmount={discountAmount}
                total={total}
                estimatedCost={cartEstimatedCost}
                grossProfit={cartGrossProfit}
                grossMarginPercent={cartGrossMarginPercent}
                hasNegativeMargin={cartHasNegativeMargin}
                projectedLossAmount={cartProjectedLossAmount}
                discountApprovalThreshold={discountApprovalThreshold}
                minimumMarginThreshold={cartMinimumMarginThreshold}
                isBelowMinimumMarginThreshold={cartBelowMinimumMarginThreshold}
                isShiftOpen={isShiftOpen}
                checkoutApprovalHint={checkoutApprovalHint}
                paymentMethod={paymentMethod}
                isSplitPayment={isSplitPayment}
                splitPayment={splitPayment}
                cashReceived={cashReceived}
                changeAmount={changeAmount}
                onDiscountChange={onDiscountChange}
                onPaymentMethodChange={onPaymentMethodChange}
                onSplitPaymentToggle={onSplitPaymentToggle}
                onSplitPaymentAmountChange={onSplitPaymentAmountChange}
                onApplySplitPaymentPreset={onApplySplitPaymentPreset}
                onCashReceivedChange={onCashReceivedChange}
                onIncreaseQty={onIncreaseQty}
                onDecreaseQty={onDecreaseQty}
                onRemoveItem={onRemoveItem}
                onHoldOrder={onHoldOrder}
                onRestoreDraft={onRestoreCartDraft}
                onDiscardDraft={onDiscardCartDraft}
                onClear={onClear}
                onCheckout={onCheckout}
                disableCheckout={isSyncing}
              />
            </div>
          </section>
        )}
      </div>

      <div className="lg:hidden relative overflow-hidden">
        {mobileTab === "home" && (
          <div className="grid gap-3 animate-slide-up">
            <CashierHomePanel
              cartItemCount={itemCount}
              heldOrderCount={heldOrders.length}
              todaySalesCount={todaySalesCount}
              todayRevenue={todayRevenue}
            />
            <CashierShiftPanel
              activeShift={activeShift}
              expectedClosingCash={shiftExpectedClosingCash}
              shiftCashSalesTotal={shiftCashSalesTotal}
              varianceThreshold={shiftVarianceThreshold}
              recentShifts={recentShiftHistory}
              onOpenShift={onOpenShift}
              onCloseShift={onCloseShift}
              onAddCashMovement={onAddCashMovement}
            />
            <ReportsPanel sales={sales} />
          </div>
        )}
        {mobileTab === "products" && (
          <div className={`animate-slide-in-right ${itemCount > 0 ? "pb-36" : "pb-24"}`}>
            <ProductGrid products={products} onAdd={onAddItem} />
          </div>
        )}
        {mobileTab === "cart" && (
          <div className="animate-slide-in-right">
            <CartPanel customers={customers} selectedCustomerId={selectedCustomerId} onSelectCustomer={onSelectCustomer}
              selectedCustomerLoyaltyPoints={selectedCustomerLoyaltyPoints}
              selectedCustomerMemberTier={selectedCustomerMemberTier}
              selectedCustomerLoyaltyMultiplier={selectedCustomerLoyaltyMultiplier}
              estimatedEarnedPoints={estimatedEarnedPoints}
              selectedCustomerOutstandingDebt={selectedCustomerOutstandingDebt}
              loyaltyPointValue={loyaltyPointValue}
              redeemedPoints={redeemedPoints}
              loyaltyRedeemAmount={loyaltyRedeemAmount}
              maxRedeemablePoints={maxRedeemablePoints}
              onRedeemedPointsChange={onRedeemedPointsChange}
              cart={cart}
              stockByProductId={stockByProductId}
              pendingDraft={pendingCartDraftSummary}
              subtotal={subtotal}
              discountPercent={discountPercent}
                manualDiscountAmount={manualDiscountAmount}
                autoPromotionDiscountAmount={autoPromotionDiscountAmount}
                appliedAutoDiscountLabels={appliedAutoDiscountLabels}
              discountAmount={discountAmount}
              total={total}
              estimatedCost={cartEstimatedCost}
              grossProfit={cartGrossProfit}
              grossMarginPercent={cartGrossMarginPercent}
              hasNegativeMargin={cartHasNegativeMargin}
              projectedLossAmount={cartProjectedLossAmount}
              discountApprovalThreshold={discountApprovalThreshold}
              minimumMarginThreshold={cartMinimumMarginThreshold}
              isBelowMinimumMarginThreshold={cartBelowMinimumMarginThreshold}
              isShiftOpen={isShiftOpen}
              checkoutApprovalHint={checkoutApprovalHint}
              paymentMethod={paymentMethod}
              isSplitPayment={isSplitPayment}
              splitPayment={splitPayment}
              cashReceived={cashReceived}
              changeAmount={changeAmount}
              onDiscountChange={onDiscountChange}
              onPaymentMethodChange={onPaymentMethodChange}
              onSplitPaymentToggle={onSplitPaymentToggle}
              onSplitPaymentAmountChange={onSplitPaymentAmountChange}
              onApplySplitPaymentPreset={onApplySplitPaymentPreset}
              onCashReceivedChange={onCashReceivedChange}
              onIncreaseQty={onIncreaseQty}
              onDecreaseQty={onDecreaseQty}
              onRemoveItem={onRemoveItem}
              onHoldOrder={onHoldOrder}
              onRestoreDraft={onRestoreCartDraft}
              onDiscardDraft={onDiscardCartDraft}
              onClear={onClear}
              onCheckout={onCheckout}
              disableCheckout={isSyncing}
            />
          </div>
        )}
        {mobileTab === "history" && (
          <div className="animate-slide-in-right">
            <SalesHistory
              sales={sales}
              onPrint={onPrintReceipt}
              onRequestRefund={onRequestRefund}
              onRequestVoid={onRequestVoid}
            />
          </div>
        )}
      </div>

      {mobileTab === "products" && itemCount > 0 && (
        <div 
          className="fixed inset-x-0 z-40 px-6 lg:hidden animate-slide-up"
          style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={() => setMobileTab("cart")}
              className="flex w-full items-center justify-between rounded-2xl bg-primary/95 px-4 py-3 text-on-primary editorial-shadow tap-bounce"
            >
              <div className="flex items-center gap-3">
                <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/20">
                  <span className="material-symbols-outlined text-white">shopping_basket</span>
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container">
                    {itemCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Total Items</p>
                  <p className="font-headline text-xl font-extrabold leading-none text-white sm:text-2xl">Rp {total.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <span className="rounded-xl bg-white px-6 py-3 text-sm font-bold tracking-tight text-primary hover:bg-surface-container-low transition-colors">Checkout</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-white/90 px-3 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden transition-all duration-300">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setMobileTab("home")}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-12 transition-colors duration-200 ${mobileTab === "home" ? "text-primary" : "text-on-surface-variant"}`}
          >
            <div className={`flex w-16 h-8 items-center justify-center rounded-full transition-all duration-300 ${mobileTab === "home" ? "bg-primary/15" : "bg-transparent"}`}>
               <span className="material-symbols-outlined text-[20px] transition-transform" style={mobileTab === "home" ? { fontVariationSettings: "'FILL' 1" } : undefined}>home</span>
            </div>
            <span className={`text-[10px] uppercase tracking-[0.12em] ${mobileTab === "home" ? "font-bold" : "font-medium"}`}>Home</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("products")}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-12 transition-colors duration-200 ${mobileTab === "products" ? "text-primary" : "text-on-surface-variant"}`}
          >
            <div className={`flex w-16 h-8 items-center justify-center rounded-full transition-all duration-300 ${mobileTab === "products" ? "bg-primary/15" : "bg-transparent"}`}>
               <span className="material-symbols-outlined text-[20px] transition-transform" style={mobileTab === "products" ? { fontVariationSettings: "'FILL' 1" } : undefined}>grid_view</span>
            </div>
            <span className={`text-[10px] uppercase tracking-[0.12em] ${mobileTab === "products" ? "font-bold" : "font-medium"}`}>Katalog</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-12 transition-colors duration-200 ${mobileTab === "cart" ? "text-primary" : "text-on-surface-variant"}`}
          >
            <div className={`flex w-16 h-8 items-center justify-center rounded-full transition-all duration-300 ${mobileTab === "cart" ? "bg-primary/15" : "bg-transparent"}`}>
               <span className="material-symbols-outlined text-[20px] transition-transform" style={mobileTab === "cart" ? { fontVariationSettings: "'FILL' 1" } : undefined}>shopping_cart</span>
            </div>
            <span className={`text-[10px] uppercase tracking-[0.12em] ${mobileTab === "cart" ? "font-bold" : "font-medium"}`}>Keranjang</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("history")}
            className={`flex flex-col items-center justify-center gap-1 text-xs font-semibold h-12 transition-colors duration-200 ${mobileTab === "history" ? "text-primary" : "text-on-surface-variant"}`}
          >
            <div className={`flex w-16 h-8 items-center justify-center rounded-full transition-all duration-300 ${mobileTab === "history" ? "bg-primary/15" : "bg-transparent"}`}>
               <span className="material-symbols-outlined text-[20px] transition-transform" style={mobileTab === "history" ? { fontVariationSettings: "'FILL' 1" } : undefined}>receipt_long</span>
            </div>
            <span className={`text-[10px] uppercase tracking-[0.12em] ${mobileTab === "history" ? "font-bold" : "font-medium"}`}>Riwayat</span>
          </button>
        </div>
      </nav>
    </section>
  );
}
