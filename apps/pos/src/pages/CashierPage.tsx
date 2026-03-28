import { useMemo, useState } from "react";
import { ProductGrid } from "../components/ProductGrid";
import { CartPanel } from "../components/CartPanel";
import { SalesHistory } from "../components/SalesHistory";
import { ReportsPanel } from "../components/ReportsPanel";
import { HoldOrdersBar, type HeldOrder } from "../components/HoldOrdersBar";
import type { CartItem, PaymentMethod } from "../types";
import type { ProductItem } from "../localData";
import type { LocalSale } from "../database";

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
  cashReceived: number;
  changeAmount: number;
  isSyncing: boolean;
  onAddItem: (id: string, name: string, price: number) => void;
  onDiscountChange: (value: number) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onCashReceivedChange: (value: number) => void;
  onIncreaseQty: (id: string) => void;
  onDecreaseQty: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onHoldOrder: () => void;
  onResumeOrder: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  onPrintReceipt: (saleId: string) => void;
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
  cashReceived,
  changeAmount,
  isSyncing,
  onAddItem,
  onDiscountChange,
  onPaymentMethodChange,
  onCashReceivedChange,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onHoldOrder,
  onResumeOrder,
  onClear,
  onCheckout,
  onPrintReceipt
}: CashierPageProps) {
  const [mobileTab, setMobileTab] = useState<"home" | "products" | "cart" | "history">("home");
  const itemCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

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
            cashReceived={cashReceived}
            changeAmount={changeAmount}
            onDiscountChange={onDiscountChange}
            onPaymentMethodChange={onPaymentMethodChange}
            onCashReceivedChange={onCashReceivedChange}
            onIncreaseQty={onIncreaseQty}
            onDecreaseQty={onDecreaseQty}
            onRemoveItem={onRemoveItem}
            onHoldOrder={onHoldOrder}
            onClear={onClear}
            onCheckout={onCheckout}
            disableCheckout={isSyncing}
          />
          <SalesHistory sales={sales} onPrint={onPrintReceipt} />
        </div>
      </div>

      <div className="lg:hidden">
        {mobileTab === "home" && <ReportsPanel sales={sales} />}
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
            cashReceived={cashReceived}
            changeAmount={changeAmount}
            onDiscountChange={onDiscountChange}
            onPaymentMethodChange={onPaymentMethodChange}
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
        {mobileTab === "history" && <SalesHistory sales={sales} onPrint={onPrintReceipt} />}
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
