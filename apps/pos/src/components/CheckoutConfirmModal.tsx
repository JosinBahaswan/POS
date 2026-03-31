import type { PaymentBreakdown, PaymentMethod } from "../types";

type CheckoutConfirmModalProps = {
  open: boolean;
  itemCount: number;
  subtotal?: number;
  total: number;
  manualDiscountAmount?: number;
  autoPromotionDiscountAmount?: number;
  appliedAutoDiscountLabels?: string[];
  paymentMethod: PaymentMethod;
  isSplitPayment?: boolean;
  paymentBreakdown?: PaymentBreakdown;
  loyaltyPreview?: {
    tier: "Silver" | "Gold" | "Platinum";
    earnedPoints: number;
    redeemedPoints: number;
    redeemedAmount: number;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function CheckoutConfirmModal({
  open,
  itemCount,
  subtotal,
  total,
  manualDiscountAmount = 0,
  autoPromotionDiscountAmount = 0,
  appliedAutoDiscountLabels = [],
  paymentMethod,
  isSplitPayment = false,
  paymentBreakdown,
  loyaltyPreview = null,
  onClose,
  onConfirm,
  loading = false
}: CheckoutConfirmModalProps) {
  if (!open) return null;

  const effectiveSubtotal = subtotal ?? total;
  const autoDiscountLabel = appliedAutoDiscountLabels.length > 0
    ? appliedAutoDiscountLabels.slice(0, 2).join(" + ")
    : "Promo/Bundle";
  const hasAnyDiscount = manualDiscountAmount > 0 || autoPromotionDiscountAmount > 0;

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

          <div className="mt-1 rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
            <p className="flex items-center justify-between gap-3">
              <span>Subtotal</span>
              <strong className="text-on-surface">Rp {Math.round(effectiveSubtotal).toLocaleString("id-ID")}</strong>
            </p>
            {manualDiscountAmount > 0 && (
              <p className="mt-1 flex items-center justify-between gap-3">
                <span>Diskon manual</span>
                <strong className="text-error">- Rp {Math.round(manualDiscountAmount).toLocaleString("id-ID")}</strong>
              </p>
            )}
            {autoPromotionDiscountAmount > 0 && (
              <p className="mt-1 flex items-center justify-between gap-3">
                <span>Diskon otomatis ({autoDiscountLabel})</span>
                <strong className="text-secondary">- Rp {Math.round(autoPromotionDiscountAmount).toLocaleString("id-ID")}</strong>
              </p>
            )}
            {!hasAnyDiscount && effectiveSubtotal > total && (
              <p className="mt-1 flex items-center justify-between gap-3">
                <span>Diskon</span>
                <strong className="text-error">- Rp {Math.round(effectiveSubtotal - total).toLocaleString("id-ID")}</strong>
              </p>
            )}
          </div>

          {loyaltyPreview && (loyaltyPreview.earnedPoints > 0 || loyaltyPreview.redeemedPoints > 0) && (
            <div className="rounded-xl bg-secondary-container/40 px-3 py-2 text-xs text-on-secondary-container">
              <p>Tier: {loyaltyPreview.tier}</p>
              {loyaltyPreview.redeemedPoints > 0 && (
                <p>
                  Tukar poin: {loyaltyPreview.redeemedPoints.toLocaleString("id-ID")}
                  {" "}(Rp {Math.round(loyaltyPreview.redeemedAmount).toLocaleString("id-ID")})
                </p>
              )}
              {loyaltyPreview.earnedPoints > 0 && (
                <p>Dapat poin: +{loyaltyPreview.earnedPoints.toLocaleString("id-ID")}</p>
              )}
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
