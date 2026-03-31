import type { LocalSale } from "../../database";
import { saleIsSplitPayment } from "./utils";

type SalesHistoryMobileProps = {
  sales: LocalSale[];
  actionButtonClass: string;
  onOpenDetail: (saleId: string) => void;
  onPrint?: (saleId: string) => void;
  onOpenActionDialog: (saleId: string, mode: "refund" | "void") => void;
};

export function SalesHistoryMobile({
  sales,
  actionButtonClass,
  onOpenDetail,
  onPrint,
  onOpenActionDialog
}: SalesHistoryMobileProps) {
  return (
    <aside className="rounded-3xl bg-surface px-2 py-2 sm:px-3 sm:py-3 enter-fade-up lg:hidden">
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
        {sales.map((sale) => {
          const isSplit = saleIsSplitPayment(sale);
          const paymentLabel = isSplit ? "SPLIT" : sale.paymentMethod.toUpperCase();

          return (
            <li key={sale.id} className="rounded-2xl bg-surface-container-lowest p-3 editorial-shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-container-low text-primary">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline text-sm font-bold text-on-surface sm:text-base">{sale.id}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(sale.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {paymentLabel}
                    </p>
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
                <span className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold">
                  {sale.items.reduce((acc, item) => acc + item.qty, 0)} item
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenDetail(sale.id)}
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

                {sale.status === "completed" && (
                  <button
                    type="button"
                    onClick={() => onOpenActionDialog(sale.id, "refund")}
                    className={`${actionButtonClass} bg-tertiary-fixed text-on-tertiary-fixed-variant`}
                  >
                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                    Refund
                  </button>
                )}

                {sale.status === "completed" && (
                  <button
                    type="button"
                    onClick={() => onOpenActionDialog(sale.id, "void")}
                    className={`${actionButtonClass} bg-error-container text-on-error-container`}
                  >
                    <span className="material-symbols-outlined text-[14px]">block</span>
                    Void
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
