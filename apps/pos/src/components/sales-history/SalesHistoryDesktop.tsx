import type { LocalSale } from "../../database";
import type { SalesMethodFilter, SalesStatusFilter } from "./types";
import {
  getCustomerInitials,
  getCustomerLabel,
  getSaleStatusBadgeClass,
  paymentMethodIcon,
  paymentMethodLabel
} from "./utils";

type SalesHistoryDesktopProps = {
  statusFilter: SalesStatusFilter;
  methodFilter: SalesMethodFilter;
  onStatusFilterChange: (value: SalesStatusFilter) => void;
  onMethodFilterChange: (value: SalesMethodFilter) => void;
  onApplyFilter: () => void;
  todayRevenue: number;
  growthPercent: number | null;
  filteredSales: LocalSale[];
  displayedSales: LocalSale[];
  currentPage: number;
  totalPages: number;
  pageStartIndex: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onExportCsv: () => void;
  onOpenDetail: (saleId: string) => void;
  onPrint?: (saleId: string) => void;
  onOpenActionDialog: (saleId: string, mode: "refund" | "void") => void;
};

export function SalesHistoryDesktop({
  statusFilter,
  methodFilter,
  onStatusFilterChange,
  onMethodFilterChange,
  onApplyFilter,
  todayRevenue,
  growthPercent,
  filteredSales,
  displayedSales,
  currentPage,
  totalPages,
  pageStartIndex,
  onPreviousPage,
  onNextPage,
  onExportCsv,
  onOpenDetail,
  onPrint,
  onOpenActionDialog
}: SalesHistoryDesktopProps) {
  return (
    <section className="hidden space-y-6 lg:block">
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(260px,1fr)] gap-6">
        <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2 grid gap-1">
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Date Range</label>
              <div className="flex h-11 items-center rounded-xl bg-surface-container-low px-3 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined mr-2 text-[18px] text-primary">calendar_month</span>
                {new Date().toLocaleDateString("id-ID")} - {new Date().toLocaleDateString("id-ID")}
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value as SalesStatusFilter)}
                className="h-11 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-primary/20"
              >
                <option value="all">All Status</option>
                <option value="completed">Success</option>
                <option value="refunded">Refunded</option>
                <option value="voided">Voided</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Payment</label>
              <select
                value={methodFilter}
                onChange={(event) => onMethodFilterChange(event.target.value as SalesMethodFilter)}
                className="h-11 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-primary/20"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="qris">QRIS</option>
                <option value="split">Split</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onApplyFilter}
              className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary"
            >
              Apply Filter
            </button>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-primary-container p-6 text-on-primary shadow-lg shadow-primary/15">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-primary/75">Today's Volume</p>
          <p className="mt-2 font-headline text-3xl font-extrabold">Rp {todayRevenue.toLocaleString("id-ID")}</p>
          <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-on-primary/10 px-2.5 py-1 text-xs font-bold text-secondary-container">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            {growthPercent === null ? "-" : `${growthPercent >= 0 ? "+" : ""}${growthPercent.toFixed(1)}% from yesterday`}
          </p>
          <span className="pointer-events-none absolute -bottom-6 -right-4 material-symbols-outlined text-[92px] text-on-primary/10">account_balance_wallet</span>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container px-8 py-5">
          <h2 className="font-headline text-xl font-bold text-on-surface">Recent Transactions</h2>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-primary transition hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low/40">
                <th className="px-8 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Date &amp; Time</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Order ID</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Customer</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Amount</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Method</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Status</th>
                <th className="px-8 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center text-sm text-on-surface-variant">
                    Belum ada transaksi pada filter ini.
                  </td>
                </tr>
              )}

              {displayedSales.map((sale) => {
                const customer = getCustomerLabel(sale);
                const initials = getCustomerInitials(customer);

                return (
                  <tr key={sale.id} className="group transition-colors hover:bg-surface-container-low/30">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{new Date(sale.createdAt).toLocaleDateString("id-ID")}</span>
                        <span className="text-xs text-on-surface-variant">{new Date(sale.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-medium text-primary">{sale.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-container-high text-[11px] font-bold text-primary">{initials}</span>
                        <span className="text-sm font-medium text-on-surface">{customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-on-surface">Rp {sale.total.toLocaleString("id-ID")}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">{paymentMethodIcon(sale)}</span>
                        {paymentMethodLabel(sale)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={getSaleStatusBadgeClass(sale.status)}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {sale.status === "completed" ? "Success" : sale.status === "refunded" ? "Refunded" : "Voided"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(sale.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-surface-container-low px-2.5 text-[11px] font-semibold text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Detail
                        </button>
                        {onPrint && (
                          <button
                            type="button"
                            onClick={() => onPrint(sale.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-surface-container-low px-2.5 text-[11px] font-semibold text-primary"
                          >
                            <span className="material-symbols-outlined text-[14px]">print</span>
                            Print
                          </button>
                        )}
                        {sale.status === "completed" && (
                          <button
                            type="button"
                            onClick={() => onOpenActionDialog(sale.id, "refund")}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-tertiary-fixed px-2.5 text-[11px] font-semibold text-on-tertiary-fixed-variant"
                          >
                            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                            Refund
                          </button>
                        )}
                        {sale.status === "completed" && (
                          <button
                            type="button"
                            onClick={() => onOpenActionDialog(sale.id, "void")}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-error-container px-2.5 text-[11px] font-semibold text-on-error-container"
                          >
                            <span className="material-symbols-outlined text-[14px]">block</span>
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-surface-container-low bg-surface-container-low/30 px-8 py-5">
          <p className="text-xs font-medium text-on-surface-variant">Showing {filteredSales.length === 0 ? 0 : pageStartIndex + 1} to {pageStartIndex + displayedSales.length} of {filteredSales.length} transactions</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPreviousPage}
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-white disabled:opacity-40"
              disabled={currentPage <= 1}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="grid h-8 min-w-[2rem] place-items-center rounded-lg bg-primary px-2 text-xs font-bold text-on-primary">{currentPage}/{totalPages}</span>
            <button
              type="button"
              onClick={onNextPage}
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-white disabled:opacity-40"
              disabled={currentPage >= totalPages}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-3 gap-6">
        <article className="flex items-start gap-3 rounded-xl border border-white/50 bg-surface-container-low p-5">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-white">
            <span className="material-symbols-outlined text-primary">print</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Thermal Printer Active</h4>
            <p className="mt-1 text-xs text-on-surface-variant">Sistem kasir terhubung ke printer dan struk otomatis siap dicetak.</p>
          </div>
        </article>

        <article className="flex items-start gap-3 rounded-xl border border-white/50 bg-surface-container-low p-5">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-white">
            <span className="material-symbols-outlined text-tertiary">warning</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Refund Policy</h4>
            <p className="mt-1 text-xs text-on-surface-variant">Transaksi nilai tinggi wajib approval manager/owner sesuai policy aktif.</p>
          </div>
        </article>

        <article className="flex items-start gap-3 rounded-xl border border-white/50 bg-surface-container-low p-5">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-white">
            <span className="material-symbols-outlined text-secondary">support_agent</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-on-surface">Need Assistance?</h4>
            <p className="mt-1 text-xs text-on-surface-variant">Gunakan menu Support untuk bantuan remote saat ada kendala terminal.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
