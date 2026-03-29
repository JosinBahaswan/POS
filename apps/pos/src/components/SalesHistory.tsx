import { useMemo, useState } from "react";
import type { LocalSale } from "../database";

type SalesHistoryProps = {
  sales: LocalSale[];
  onPrint?: (saleId: string) => void;
  onRequestRefund?: (saleId: string, reason: string) => void;
  onRequestVoid?: (saleId: string, reason: string) => void;
};

export function SalesHistory({ sales, onPrint, onRequestRefund, onRequestVoid }: SalesHistoryProps) {
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const actionButtonClass = "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold";

  const activeSale = useMemo(
    () => sales.find((sale) => sale.id === activeSaleId) ?? null,
    [sales, activeSaleId]
  );

  const requestAction = (saleId: string, mode: "refund" | "void") => {
    const reason = window.prompt(
      mode === "refund" ? "Alasan pengajuan refund" : "Alasan pengajuan void",
      ""
    );
    if (!reason || reason.trim().length === 0) return;

    if (mode === "refund") {
      onRequestRefund?.(saleId, reason.trim());
      return;
    }

    onRequestVoid?.(saleId, reason.trim());
  };

  return (
    <aside className="rounded-3xl bg-surface px-2 py-2 sm:px-3 sm:py-3 enter-fade-up">
      <div className="flex items-center justify-between px-2">
        <h2 className="font-headline text-sm font-extrabold uppercase tracking-[0.12em] text-on-surface-variant sm:text-base">Aktivitas Terbaru</h2>
        {sales.length > 0 && <span className="text-xs font-bold text-primary sm:text-sm">Lihat Riwayat</span>}
      </div>

      {sales.length === 0 && (
        <p className="mt-3 rounded-2xl bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
          Belum ada transaksi.
        </p>
      )}

      <ul className="mt-3 grid gap-2.5">
        {sales.map((sale) => (
          <li key={sale.id} className="rounded-2xl bg-surface-container-lowest p-3 editorial-shadow">
            {(() => {
              const splitParts = sale.paymentBreakdown
                ? [sale.paymentBreakdown.cash, sale.paymentBreakdown.card, sale.paymentBreakdown.qris].filter((part) => part > 0)
                : [];
              const isSplit = splitParts.length > 1;
              const paymentLabel = isSplit ? "SPLIT" : sale.paymentMethod.toUpperCase();

              return (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-container-low text-primary">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-headline text-sm font-bold text-on-surface sm:text-base">{sale.id}</p>
                        <p className="text-xs text-on-surface-variant">{new Date(sale.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {paymentLabel}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-headline text-base font-bold text-on-surface sm:text-lg">Rp {sale.total.toLocaleString("id-ID")}</p>
                      <span
                        className={
                          sale.synced
                            ? "inline-flex rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-secondary-container"
                            : "inline-flex rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-fixed-variant"
                        }
                      >
                        {sale.synced ? "Lunas" : "Pending"}
                      </span>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                        {sale.status}
                      </p>
                    </div>
                  </div>

                  {isSplit && sale.paymentBreakdown && (
                    <p className="mt-2 rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                      Tunai Rp {sale.paymentBreakdown.cash.toLocaleString("id-ID")} • Kartu Rp {sale.paymentBreakdown.card.toLocaleString("id-ID")} • QRIS Rp {sale.paymentBreakdown.qris.toLocaleString("id-ID")}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{new Date(sale.createdAt).toLocaleString("id-ID")}</span>
                    <span
                      className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold"
                    >
                      {sale.items.reduce((acc, item) => acc + item.qty, 0)} item
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveSaleId(sale.id)}
                      className={`${actionButtonClass} bg-surface-container-high text-on-surface`}
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Detail
                    </button>

                    {onPrint && (
                      <button
                        type="button"
                        onClick={() => onPrint(sale.id)}
                        className={`${actionButtonClass} bg-surface-container-low text-on-primary-fixed-variant`}
                      >
                        <span className="material-symbols-outlined text-[14px]">print</span>
                        Cetak
                      </button>
                    )}

                    {sale.status === "completed" && onRequestRefund && (
                      <button
                        type="button"
                        onClick={() => requestAction(sale.id, "refund")}
                        className={`${actionButtonClass} bg-tertiary-fixed text-on-tertiary-fixed-variant`}
                      >
                        <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                        Refund
                      </button>
                    )}

                    {sale.status === "completed" && onRequestVoid && (
                      <button
                        type="button"
                        onClick={() => requestAction(sale.id, "void")}
                        className={`${actionButtonClass} bg-error-container text-on-error-container`}
                      >
                        <span className="material-symbols-outlined text-[14px]">block</span>
                        Void
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </li>
        ))}
      </ul>

      {activeSale && (
        <div
          className="fixed inset-0 z-[75] flex items-end justify-center bg-black/30 px-3 pb-4 pt-20 sm:items-center sm:p-6"
          onClick={() => setActiveSaleId(null)}
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
                onClick={() => setActiveSaleId(null)}
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
              <p className="font-headline text-lg font-bold text-on-surface">Total: Rp {activeSale.total.toLocaleString("id-ID")}</p>
            </div>
          </aside>
        </div>
      )}
    </aside>
  );
}
