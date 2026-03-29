import { useMemo, useState } from "react";
import { ProductGrid } from "../components/ProductGrid";
import { CartPanel } from "../components/CartPanel";
import { SalesHistory } from "../components/SalesHistory";
import { CashierHomePanel } from "../components/CashierHomePanel";
import { CashierShiftPanel } from "../components/CashierShiftPanel";
import { ReportsPanel } from "../components/ReportsPanel";
import { HoldOrdersBar, type HeldOrder } from "../components/HoldOrdersBar";
import type { CartItem, PaymentBreakdown, PaymentMethod } from "../types";
import type { ProductItem } from "../localData";
import type { LocalSale } from "../database";
import type { CashMovementType, ShiftSession } from "../shift";

type CashierPageProps = {
  products: ProductItem[];
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
  const [mobileTab, setMobileTab] = useState<"home" | "products" | "cart" | "history">("home");
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
          <CartPanel
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

      <div className="lg:hidden">
        {mobileTab === "home" && (
          <div className="grid gap-3">
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
          <div className={itemCount > 0 ? "pb-36" : "pb-24"}>
            <ProductGrid products={products} onAdd={onAddItem} />
          </div>
        )}
        {mobileTab === "cart" && (
          <CartPanel
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
        )}
        {mobileTab === "history" && (
          <SalesHistory
            sales={sales}
            onPrint={onPrintReceipt}
            onRequestRefund={onRequestRefund}
            onRequestVoid={onRequestVoid}
          />
        )}
      </div>

      {mobileTab === "products" && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-24 z-40 px-6 lg:hidden">
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Total Items</p>
                  <p className="font-headline text-xl font-extrabold leading-none text-white sm:text-2xl">Rp {total.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <span className="rounded-xl bg-white px-6 py-3 text-sm font-bold tracking-tight text-primary">Checkout</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/40 bg-white/90 px-3 pb-6 pt-2 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setMobileTab("home")}
            className={mobileTab === "home" ? "flex h-12 flex-col items-center justify-center rounded-xl bg-teal-100/60 text-primary" : "flex h-12 flex-col items-center justify-center rounded-xl text-on-surface-variant"}
          >
            <span className="material-symbols-outlined text-[18px]" style={mobileTab === "home" ? { fontVariationSettings: "'FILL' 1" } : undefined}>home</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">Home</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("products")}
            className={mobileTab === "products" ? "flex h-12 flex-col items-center justify-center rounded-xl bg-teal-100/60 text-primary" : "flex h-12 flex-col items-center justify-center rounded-xl text-on-surface-variant"}
          >
            <span className="material-symbols-outlined text-[18px]" style={mobileTab === "products" ? { fontVariationSettings: "'FILL' 1" } : undefined}>grid_view</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">Katalog</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className={mobileTab === "cart" ? "flex h-12 flex-col items-center justify-center rounded-xl bg-teal-100/60 text-primary" : "flex h-12 flex-col items-center justify-center rounded-xl text-on-surface-variant"}
          >
            <span className="material-symbols-outlined text-[18px]" style={mobileTab === "cart" ? { fontVariationSettings: "'FILL' 1" } : undefined}>shopping_cart</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">Keranjang</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("history")}
            className={mobileTab === "history" ? "flex h-12 flex-col items-center justify-center rounded-xl bg-teal-100/60 text-primary" : "flex h-12 flex-col items-center justify-center rounded-xl text-on-surface-variant"}
          >
            <span className="material-symbols-outlined text-[18px]" style={mobileTab === "history" ? { fontVariationSettings: "'FILL' 1" } : undefined}>receipt_long</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]">Riwayat</span>
          </button>
        </div>
      </nav>
    </section>
  );
}
