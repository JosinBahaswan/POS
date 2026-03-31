import type { LocalSale } from "../../database";

type SaleDetailModalProps = {
  activeSale: LocalSale | null;
  onClose: () => void;
};

export function SaleDetailModal({ activeSale, onClose }: SaleDetailModalProps) {
  if (!activeSale) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/30 px-3 pb-4 pt-20 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-2xl rounded-2xl bg-surface-container-low p-4 editorial-shadow sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Detail Transaksi</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{activeSale.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-container-high text-on-surface-variant"
            aria-label="Tutup detail transaksi"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-on-surface-variant sm:grid-cols-2">
          <p>Waktu: {new Date(activeSale.createdAt).toLocaleString("id-ID")}</p>
          <p>Metode: {activeSale.paymentMethod.toUpperCase()}</p>
          <p>Status: {activeSale.status.toUpperCase()}</p>
          <p>Shift: {activeSale.shiftId || "-"}</p>
        </div>

        {activeSale.paymentBreakdown && (
          <p className="mt-3 rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
            Split pembayaran: Tunai Rp {activeSale.paymentBreakdown.cash.toLocaleString("id-ID")} • Kartu Rp {activeSale.paymentBreakdown.card.toLocaleString("id-ID")} • QRIS Rp {activeSale.paymentBreakdown.qris.toLocaleString("id-ID")}
          </p>
        )}

        <ul className="mt-4 grid gap-2">
          {activeSale.items.map((item) => (
            <li
              key={`${activeSale.id}-${item.id}`}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2"
            >
              <div>
                <p className="font-semibold text-on-surface">{item.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {item.qty} x Rp {item.price.toLocaleString("id-ID")}
                </p>
              </div>
              <p className="font-semibold text-on-surface">Rp {(item.qty * item.price).toLocaleString("id-ID")}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
          <p>Subtotal: Rp {activeSale.subtotal.toLocaleString("id-ID")}</p>
          <p>Diskon: Rp {activeSale.discountAmount.toLocaleString("id-ID")}</p>
          {activeSale.redeemedAmount !== undefined && activeSale.redeemedAmount > 0 && (
            <p>
              Tukar Poin: - Rp {Math.round(activeSale.redeemedAmount).toLocaleString("id-ID")}
              {activeSale.redeemedPoints ? ` (${activeSale.redeemedPoints.toLocaleString("id-ID")} poin)` : ""}
            </p>
          )}
          {activeSale.earnedPoints !== undefined && activeSale.earnedPoints > 0 && (
            <p>Poin Didapat: +{activeSale.earnedPoints.toLocaleString("id-ID")}</p>
          )}
          <p className="font-headline text-lg font-bold text-on-surface">Total: Rp {activeSale.total.toLocaleString("id-ID")}</p>
        </div>
      </aside>
    </div>
  );
}
