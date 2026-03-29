import type { CartItem, PaymentBreakdown, PaymentMethod } from "../types";

export type HeldOrder = {
  id: string;
  createdAt: string;
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  paymentMethod: PaymentMethod;
  isSplitPayment?: boolean;
  paymentBreakdown?: PaymentBreakdown;
  items: CartItem[];
};

type HoldOrdersBarProps = {
  orders: HeldOrder[];
  onResume: (id: string) => void;
};

export function HoldOrdersBar({ orders, onResume }: HoldOrdersBarProps) {
  return (
    <section className="rounded-3xl bg-surface-container-low px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant sm:text-base">Order Tertahan</h2>
        <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
          {orders.length}
        </span>
      </div>
      {orders.length === 0 ? (
        <p className="mt-2 text-xs text-on-surface-variant sm:text-sm">Belum ada order yang ditahan.</p>
      ) : (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => onResume(order.id)}
              className="min-w-[170px] rounded-2xl bg-surface-container-lowest p-3 text-left text-xs transition hover:brightness-95 active:scale-[0.99] sm:text-sm"
            >
              <p className="font-headline text-sm font-bold text-on-surface">{order.id}</p>
              <p className="mt-0.5 text-on-surface-variant">{order.itemCount} item</p>
              <p className="font-headline text-base font-bold text-primary">Rp {order.subtotal.toLocaleString("id-ID")}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
