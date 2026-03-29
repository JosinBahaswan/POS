import type { CartItem, PaymentBreakdown, PaymentMethod } from "../types";

type CartPanelProps = {
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
  onDiscountChange: (value: number) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onSplitPaymentToggle: (enabled: boolean) => void;
  onSplitPaymentAmountChange: (method: PaymentMethod, value: number) => void;
  onCashReceivedChange: (value: number) => void;
  onIncreaseQty: (id: string) => void;
  onDecreaseQty: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onHoldOrder: () => void;
  onClear: () => void;
  onCheckout: () => void;
  disableCheckout?: boolean;
};

export function CartPanel({
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
  onDiscountChange,
  onPaymentMethodChange,
  onSplitPaymentToggle,
  onSplitPaymentAmountChange,
  onCashReceivedChange,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onHoldOrder,
  onClear,
  onCheckout,
  disableCheckout = false
}: CartPanelProps) {
  const splitTotal = splitPayment.cash + splitPayment.card + splitPayment.qris;
  const splitDifference = total - splitTotal;
  const splitValid = Math.abs(splitDifference) < 1;
  const requiresCashInput = isSplitPayment ? splitPayment.cash > 0 : paymentMethod === "cash";
  const cashTarget = isSplitPayment ? splitPayment.cash : total;

  return (
    <aside className="max-w-full space-y-4 rounded-3xl bg-surface px-2 py-2 sm:px-3 sm:py-3">
      <div className="rounded-2xl bg-surface-container-low px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">Keranjang Aktif</h2>
            <p className="truncate text-xs text-on-surface-variant sm:text-sm">ID Pesanan: #POS-{new Date().getDate().toString().padStart(2, "0")}{new Date().getHours().toString().padStart(2, "0")}{new Date().getMinutes().toString().padStart(2, "0")}</p>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-secondary-container sm:text-xs">
            Sedang Aktif
          </span>
        </div>
      </div>

      <ul className="grid gap-3">
        {cart.length === 0 && (
          <li className="rounded-2xl bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
            Belum ada item di keranjang.
          </li>
        )}
        {cart.map((item) => (
          <li key={item.id} className="rounded-2xl bg-surface-container-low px-4 py-3">
            <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="block truncate font-headline text-lg font-bold text-on-surface">{item.name}</span>
              <span className="mt-0.5 block text-sm text-on-surface-variant">SKU: {item.id}</span>
                <span className="mt-1 block font-headline text-lg font-bold text-primary sm:text-xl">Rp {item.price.toLocaleString("id-ID")}</span>
            </div>

              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-container-high text-on-surface-variant active:scale-95"
                onClick={() => onRemoveItem(item.id)}
                aria-label={`Hapus ${item.name}`}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2 rounded-xl bg-surface-container-lowest p-1">
              <button
                type="button"
                onClick={() => onDecreaseQty(item.id)}
                className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container-low text-primary active:scale-95"
                aria-label={`Kurangi ${item.name}`}
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <span className="min-w-7 text-center text-base font-bold text-on-surface">{item.qty}</span>
              <button
                type="button"
                onClick={() => onIncreaseQty(item.id)}
                className="grid h-9 w-9 place-items-center rounded-lg bg-surface-container-low text-primary active:scale-95"
                aria-label={`Tambah ${item.name}`}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 rounded-2xl bg-surface-container-low p-4">
        <label htmlFor="discount" className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Diskon (%)</label>
        <input
          id="discount"
          type="number"
          min={0}
          max={100}
          value={discountPercent}
          className="h-12 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
          onChange={(event) => onDiscountChange(Number(event.target.value || 0))}
        />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Metode Bayar</p>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Split Payment</span>
            <button
              type="button"
              onClick={() => onSplitPaymentToggle(!isSplitPayment)}
              className={
                isSplitPayment
                  ? "h-8 rounded-lg bg-primary px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-on-primary"
                  : "h-8 rounded-lg bg-surface-container-high px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
              }
            >
              {isSplitPayment ? "Aktif" : "Nonaktif"}
            </button>
          </div>

          {!isSplitPayment && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onPaymentMethodChange("cash")}
                className={paymentMethod === "cash" ? "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-primary text-on-primary tap-bounce" : "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-lowest text-on-surface-variant tap-bounce"}
              >
                <span className="material-symbols-outlined text-[22px]">payments</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => onPaymentMethodChange("qris")}
                className={paymentMethod === "qris" ? "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-primary text-on-primary tap-bounce" : "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-lowest text-on-surface-variant tap-bounce"}
              >
                <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => onPaymentMethodChange("card")}
                className={paymentMethod === "card" ? "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-primary text-on-primary tap-bounce" : "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-lowest text-on-surface-variant tap-bounce"}
              >
                <span className="material-symbols-outlined text-[22px]">credit_card</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Kartu</span>
              </button>
            </div>
          )}

          {isSplitPayment && (
            <div className="mt-2 grid gap-2">
              <div className="grid grid-cols-3 gap-2">
                <label className="rounded-xl bg-surface-container-lowest px-2 py-2 text-xs text-on-surface-variant">
                  Tunai
                  <input
                    type="number"
                    min={0}
                    value={splitPayment.cash}
                    onChange={(event) => onSplitPaymentAmountChange("cash", Number(event.target.value || 0))}
                    className="mt-1 h-9 w-full rounded-lg border-none bg-surface-container-low px-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="rounded-xl bg-surface-container-lowest px-2 py-2 text-xs text-on-surface-variant">
                  Kartu
                  <input
                    type="number"
                    min={0}
                    value={splitPayment.card}
                    onChange={(event) => onSplitPaymentAmountChange("card", Number(event.target.value || 0))}
                    className="mt-1 h-9 w-full rounded-lg border-none bg-surface-container-low px-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="rounded-xl bg-surface-container-lowest px-2 py-2 text-xs text-on-surface-variant">
                  QRIS
                  <input
                    type="number"
                    min={0}
                    value={splitPayment.qris}
                    onChange={(event) => onSplitPaymentAmountChange("qris", Number(event.target.value || 0))}
                    className="mt-1 h-9 w-full rounded-lg border-none bg-surface-container-low px-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  />
                </label>
              </div>

              <p className={splitValid ? "text-xs text-on-surface-variant" : "text-xs font-semibold text-error"}>
                Split: Rp {splitTotal.toLocaleString("id-ID")} / Total: Rp {total.toLocaleString("id-ID")}
                {!splitValid && ` (selisih Rp ${Math.abs(splitDifference).toLocaleString("id-ID")})`}
              </p>
            </div>
          )}
        </div>
      </div>

      {requiresCashInput && (
        <div className="grid gap-1.5 rounded-2xl bg-surface-container-low p-4">
          <label htmlFor="cash-received" className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Uang Diterima</label>
          <input
            id="cash-received"
            type="number"
            min={0}
            value={cashReceived}
            className="h-12 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            onChange={(event) => onCashReceivedChange(Number(event.target.value || 0))}
          />
          <p className="text-sm text-on-surface-variant">
            {isSplitPayment ? "Target Tunai" : "Tagihan Tunai"}: <span className="font-semibold text-on-surface">Rp {cashTarget.toLocaleString("id-ID")}</span>
          </p>
          <p className="text-sm text-on-surface-variant">
            Kembalian: <span className="font-headline text-xl font-bold text-on-surface">Rp {changeAmount.toLocaleString("id-ID")}</span>
          </p>
        </div>
      )}

      <div className="grid gap-2 rounded-3xl bg-surface-container-low p-5 text-sm">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Subtotal</span>
          <span className="font-headline text-lg font-bold sm:text-xl">Rp {subtotal.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Diskon</span>
          <span className="font-headline text-lg font-bold sm:text-xl">- Rp {discountAmount.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 text-on-surface">
          <strong className="font-headline text-xl sm:text-2xl">Total Akhir</strong>
          <strong className="font-headline text-2xl text-primary sm:text-3xl">Rp {total.toLocaleString("id-ID")}</strong>
        </div>
        {isSplitPayment && (
          <p className={splitValid ? "text-xs text-on-surface-variant" : "text-xs font-semibold text-error"}>
            Validasi split: {splitValid ? "sesuai" : "belum sesuai total transaksi"}
          </p>
        )}
      </div>

      <div className="sticky bottom-2 grid gap-2 rounded-2xl bg-surface-container-low px-3 py-3 backdrop-blur sm:static sm:bg-transparent sm:px-0 sm:py-0">
        <button
          className="h-11 w-full rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant transition hover:brightness-95 disabled:opacity-60"
          onClick={onHoldOrder}
          disabled={cart.length === 0}
        >
          Tahan Order
        </button>
        <button
          className="h-11 w-full rounded-xl bg-error-container text-sm font-semibold text-on-error-container transition hover:brightness-95 active:scale-[0.99]"
          onClick={onClear}
        >
          Reset
        </button>
        <button
          className="h-14 w-full rounded-2xl bg-gradient-to-br from-primary to-primary-container text-base font-bold text-on-primary transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onCheckout}
          disabled={cart.length === 0 || disableCheckout || (isSplitPayment && !splitValid)}
        >
          Konfirmasi Bayar
        </button>
      </div>
    </aside>
  );
}
