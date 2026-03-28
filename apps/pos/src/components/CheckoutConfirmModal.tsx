import type { PaymentMethod } from "../types";

type CheckoutConfirmModalProps = {
  open: boolean;
  itemCount: number;
  total: number;
  paymentMethod: PaymentMethod;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function CheckoutConfirmModal({
  open,
  itemCount,
  total,
  paymentMethod,
  onClose,
  onConfirm,
  loading = false
}: CheckoutConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-900/40 p-3 sm:place-items-center">
      <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-5 editorial-shadow sm:p-6">
        <h3 className="font-headline text-2xl font-extrabold text-on-surface">Konfirmasi pembayaran</h3>
        <div className="mt-4 grid gap-2 rounded-2xl bg-surface-container-low p-4 text-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Item</span>
            <span className="font-headline text-lg font-bold text-on-surface">{itemCount}</span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Metode</span>
            <span className="font-headline text-lg font-bold uppercase text-on-surface">{paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 text-on-surface">
            <strong className="font-headline text-xl">Total</strong>
            <strong className="font-headline text-2xl text-primary">Rp {total.toLocaleString("id-ID")}</strong>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="h-12 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="button"
            className="h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Konfirmasi"}
          </button>
        </div>
      </div>
    </div>
  );
}
