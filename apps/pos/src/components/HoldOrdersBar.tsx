import { useEffect, useState } from "react";
import type { CartItem, PaymentBreakdown, PaymentMethod } from "../types";

export type HeldOrder = {
  id: string;
  createdAt: string;
  expiresAt?: string;
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  redeemedPoints?: number;
  selectedCustomerId?: string;
  paymentMethod: PaymentMethod;
  isSplitPayment?: boolean;
  paymentBreakdown?: PaymentBreakdown;
  items: CartItem[];
};

type HoldOrdersBarProps = {
  orders: HeldOrder[];
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveExpired: () => void;
  onClearAll: () => void;
};

type HoldOrderFilter = "all" | "near-expiry" | "high-value";

const NEAR_EXPIRY_MINUTES = 30;
const HIGH_VALUE_THRESHOLD = 500_000;

export function HoldOrdersBar({ orders, onResume, onRemove, onRemoveExpired, onClearAll }: HoldOrdersBarProps) {
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HoldOrderFilter>("all");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const getRemainingMinutes = (order: HeldOrder) => {
    const expiresTs = new Date(order.expiresAt ?? order.createdAt).getTime();
    if (!Number.isFinite(expiresTs)) return null;
    return Math.max(0, Math.ceil((expiresTs - nowTs) / (60 * 1000)));
  };

  const nearExpiryCount = orders.reduce((count, order) => {
    const remainingMinutes = getRemainingMinutes(order);
    const isNearExpiry =
      remainingMinutes !== null && remainingMinutes > 0 && remainingMinutes <= NEAR_EXPIRY_MINUTES;

    return isNearExpiry ? count + 1 : count;
  }, 0);

  const expiredCount = orders.reduce((count, order) => {
    const remainingMinutes = getRemainingMinutes(order);
    const isExpired = remainingMinutes !== null && remainingMinutes <= 0;

    return isExpired ? count + 1 : count;
  }, 0);

  const highValueCount = orders.filter((order) => order.subtotal >= HIGH_VALUE_THRESHOLD).length;

  const filteredOrders = orders.filter((order) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      order.id.toLowerCase().includes(normalizedQuery) ||
      order.paymentMethod.toLowerCase().includes(normalizedQuery);

    if (!matchesQuery) return false;

    if (activeFilter === "near-expiry") {
      const remainingMinutes = getRemainingMinutes(order);
      return remainingMinutes !== null && remainingMinutes > 0 && remainingMinutes <= NEAR_EXPIRY_MINUTES;
    }

    if (activeFilter === "high-value") {
      return order.subtotal >= HIGH_VALUE_THRESHOLD;
    }

    return true;
  });

  return (
    <section className="rounded-3xl bg-surface-container-low px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant sm:text-base">Order Tertahan</h2>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
            {orders.length}
          </span>
          <button
            type="button"
            onClick={onRemoveExpired}
            disabled={expiredCount === 0}
            className={
              expiredCount > 0
                ? "rounded-full bg-error-container px-2.5 py-1 text-[11px] font-semibold text-on-error-container transition hover:brightness-95"
                : "rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-outline-variant"
            }
          >
            Kadaluarsa ({expiredCount})
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant transition hover:brightness-95"
          >
            Hapus Semua
          </button>
        </div>
      </div>
      {orders.length === 0 ? (
        <p className="mt-2 text-xs text-on-surface-variant sm:text-sm">Belum ada order yang ditahan.</p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="relative block">
              <span className="sr-only">Cari order tahan</span>
              <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari ID order atau metode bayar"
                className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-2 pl-9 pr-3 text-xs text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm"
              />
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
                  activeFilter === "all"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                Semua ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("near-expiry")}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
                  activeFilter === "near-expiry"
                    ? "bg-tertiary text-on-tertiary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                Mendesak ({nearExpiryCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("high-value")}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
                  activeFilter === "high-value"
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                Nominal Tinggi ({highValueCount})
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="mt-3 text-xs text-on-surface-variant sm:text-sm">
              Tidak ada order yang cocok dengan pencarian atau filter.
            </p>
          ) : (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="min-w-[190px] rounded-2xl bg-surface-container-lowest p-3 text-left text-xs sm:text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onResume(order.id)}
                  className="min-w-0 text-left transition hover:brightness-95"
                >
                  <p className="font-headline text-sm font-bold text-on-surface">{order.id}</p>
                  <p className="mt-0.5 text-on-surface-variant">{order.itemCount} item</p>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(order.id)}
                  className="grid h-7 w-7 place-items-center rounded-lg bg-surface-container-high text-on-surface-variant"
                  aria-label={`Hapus ${order.id}`}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="font-headline text-base font-bold text-primary">Rp {order.subtotal.toLocaleString("id-ID")}</p>

              {(() => {
                const remainingMinutes = getRemainingMinutes(order);
                if (remainingMinutes === null) return null;

                if (remainingMinutes <= 0) {
                  return (
                    <p className="mt-1 text-[11px] font-semibold text-error">
                      Sudah kadaluarsa
                    </p>
                  );
                }

                const isNearExpiry = remainingMinutes > 0 && remainingMinutes <= NEAR_EXPIRY_MINUTES;

                if (!isNearExpiry) return null;

                return (
                  <p className="mt-1 text-[11px] font-semibold text-tertiary">
                    Segera diproses: sisa {remainingMinutes} menit
                  </p>
                );
              })()}
            </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
