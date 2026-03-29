import type { PaymentBreakdown, PaymentMethod } from "../types";

type CheckoutConfirmModalProps = {
  open: boolean;
  itemCount: number;
  total: number;
  paymentMethod: PaymentMethod;
  isSplitPayment?: boolean;
  paymentBreakdown?: PaymentBreakdown;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function CheckoutConfirmModal({
  open,
  itemCount,
  total,
  paymentMethod,
  isSplitPayment = false,
  paymentBreakdown,
  onClose,
  onConfirm,
  loading = false
}: CheckoutConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end bg-slate-900/40 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:place-items-center sm:p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-5 editorial-shadow sm:p-6 animate-slide-up">
        <h3 className="font-headline text-2xl font-extrabold text-on-surface">Konfirmasi pembayaran</h3>
        <div className="mt-4 grid gap-2 rounded-2xl bg-surface-container-low p-4 text-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Item</span>
            <span className="font-headline text-lg font-bold text-on-surface">{itemCount}</span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Metode</span>
            <span className="font-headline text-lg font-bold uppercase text-on-surface">
              {isSplitPayment ? "SPLIT" : paymentMethod}
            </span>
          </div>

          {isSplitPayment && paymentBreakdown && (
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
              <p>Tunai: Rp {paymentBreakdown.cash.toLocaleString("id-ID")}</p>
              <p>Kartu: Rp {paymentBreakdown.card.toLocaleString("id-ID")}</p>
              <p>QRIS: Rp {paymentBreakdown.qris.toLocaleString("id-ID")}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 text-on-surface">
            <strong className="font-headline text-xl">Total</strong>
            <strong className="font-headline text-2xl text-primary">Rp {total.toLocaleString("id-ID")}</strong>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-3">
          <button
            type="button"
            className="order-2 h-12 w-full rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant sm:order-1 sm:col-span-1 hover:bg-surface-container-highest transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="button"
            className="order-1 h-12 w-full rounded-xl bg-gradient-to-br from-primary to-primary-container text-base font-bold tracking-tight text-on-primary shadow-lg shadow-teal-900/10 transition-transform active:scale-[0.98] disabled:opacity-60 disabled:transform-none sm:order-2 sm:col-span-3"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
