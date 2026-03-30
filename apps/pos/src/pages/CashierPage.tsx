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
  onSelectCustomer?: (id: string | undefined) => void;
  heldOrders: HeldOrder[];
  sales: LocalSale[];
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
  recentShiftHistory: ShiftSession[];
  isSyncing: boolean;
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
};

export function CashierPage({
  products,
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  heldOrders,
  sales,
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
  recentShiftHistory,
  isSyncing,
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

  return (
    <section className="mt-3 grid gap-3 pb-36 sm:mt-4 sm:gap-4 sm:pb-32 lg:pb-0">
      {heldOrders.length > 0 && <HoldOrdersBar orders={heldOrders} onResume={onResumeOrder} />}

      <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ProductGrid products={products} onAdd={onAddItem} />
        <div className="grid gap-4">
          <CartPanel customers={customers} selectedCustomerId={selectedCustomerId} onSelectCustomer={onSelectCustomer}
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
            onDiscountChange={onDiscountChange}
            onPaymentMethodChange={onPaymentMethodChange}
            onSplitPaymentToggle={onSplitPaymentToggle}
            onSplitPaymentAmountChange={onSplitPaymentAmountChange}
            onCashReceivedChange={onCashReceivedChange}
            onIncreaseQty={onIncreaseQty}
            onDecreaseQty={onDecreaseQty}
            onRemoveItem={onRemoveItem}
            onHoldOrder={onHoldOrder}
            onClear={onClear}
            onCheckout={onCheckout}
            disableCheckout={isSyncing}
          />
          <SalesHistory
            sales={sales}
            onPrint={onPrintReceipt}
            onRequestRefund={onRequestRefund}
            onRequestVoid={onRequestVoid}
          />
        </div>
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
              onDiscountChange={onDiscountChange}
              onPaymentMethodChange={onPaymentMethodChange}
              onSplitPaymentToggle={onSplitPaymentToggle}
              onSplitPaymentAmountChange={onSplitPaymentAmountChange}
              onCashReceivedChange={onCashReceivedChange}
              onIncreaseQty={onIncreaseQty}
              onDecreaseQty={onDecreaseQty}
              onRemoveItem={onRemoveItem}
              onHoldOrder={onHoldOrder}
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
