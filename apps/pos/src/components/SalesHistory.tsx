import type { LocalSale } from "../database";

type SalesHistoryProps = {
  sales: LocalSale[];
  onPrint?: (saleId: string) => void;
};

export function SalesHistory({ sales, onPrint }: SalesHistoryProps) {
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

      <ul className="mt-3 grid gap-3">
        {sales.map((sale) => (
          <li key={sale.id} className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-container-low text-primary">
                  <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                </div>
                <div className="min-w-0">
                  <p className="font-headline text-base font-bold text-on-surface sm:text-lg">{sale.id}</p>
                  <p className="text-sm text-on-surface-variant">{new Date(sale.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • {sale.paymentMethod.toUpperCase()}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-headline text-lg font-bold text-on-surface sm:text-xl">Rp {sale.total.toLocaleString("id-ID")}</p>
                <span
                  className={
                    sale.synced
                      ? "inline-flex rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-secondary-container"
                      : "inline-flex rounded-full bg-tertiary-fixed px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-fixed-variant"
                  }
                >
                  {sale.synced ? "Lunas" : "Pending"}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
              <span>{new Date(sale.createdAt).toLocaleString("id-ID")}</span>
              <span
                className="rounded-full bg-surface-container-low px-2.5 py-1 font-semibold"
              >
                {sale.items.reduce((acc, item) => acc + item.qty, 0)} item
              </span>
            </div>

            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint(sale.id)}
                className="mt-3 h-9 rounded-xl bg-surface-container-low px-3 text-xs font-semibold text-on-primary-fixed-variant"
              >
                Cetak Struk
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
