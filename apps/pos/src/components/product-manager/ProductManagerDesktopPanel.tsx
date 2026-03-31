import { useEffect, useMemo, useState } from "react";
import type { ProductItem } from "../../localData";
import { BarcodeScannerButton } from "../BarcodeScannerButton";
import { DEFAULT_PRODUCT_IMAGE, normalizeCategoryLabel } from "./types";

type CategoryConcentrationRow = {
  category: string;
  units: number;
  percent: number;
};

type ProductManagerDesktopPanelProps = {
  products: ProductItem[];
  filtered: ProductItem[];
  search: string;
  categoryFilter: string;
  categoryOptions: string[];
  selectedIdSet: Set<string>;
  allVisibleSelected: boolean;
  filteredProductIds: string[];
  selectedProductIds: string[];
  canDeleteProduct: boolean;
  canAdjustStock: boolean;
  totalStockValue: number;
  lowStockCount: number;
  catalogHealth: string;
  maxStockValue: number;
  categoryConcentration: CategoryConcentrationRow[];
  onOpenCreateForm: () => void;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onToggleSelectAllVisible: () => void;
  onRequestBulkDeleteSelected: () => void;
  onRequestBulkDeleteFiltered: () => void;
  onToggleSelectProduct: (id: string) => void;
  onEdit: (product: ProductItem) => void;
  onRestock: (product: ProductItem) => void;
  onRequestDeleteProduct: (product: ProductItem) => void;
};

export function ProductManagerDesktopPanel({
  products,
  filtered,
  search,
  categoryFilter,
  categoryOptions,
  selectedIdSet,
  allVisibleSelected,
  filteredProductIds,
  selectedProductIds,
  canDeleteProduct,
  canAdjustStock,
  totalStockValue,
  lowStockCount,
  catalogHealth,
  maxStockValue,
  categoryConcentration,
  onOpenCreateForm,
  onSearchChange,
  onCategoryFilterChange,
  onToggleSelectAllVisible,
  onRequestBulkDeleteSelected,
  onRequestBulkDeleteFiltered,
  onToggleSelectProduct,
  onEdit,
  onRestock,
  onRequestDeleteProduct
}: ProductManagerDesktopPanelProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const activePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedFiltered = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, activePage]);

  const visibleActivityItems = useMemo(
    () => (showAllActivity ? filtered.slice(0, 12) : filtered.slice(0, 2)),
    [filtered, showAllActivity]
  );

  const fromItem = filtered.length === 0 ? 0 : (activePage - 1) * itemsPerPage + 1;
  const toItem = filtered.length === 0 ? 0 : Math.min(activePage * itemsPerPage, filtered.length);

  return (
    <section className="hidden gap-6 lg:grid">
      <article className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-3xl font-extrabold text-on-surface">Catalog Repository</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Manage pricing, promotions, inventory levels, and product identities.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-semibold text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
            </button>
            <button
              type="button"
              onClick={onOpenCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add New Product
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mt-5 rounded-xl bg-surface-container-low p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  value={search}
                  onChange={(event) => {
                    onSearchChange(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-xl border-none bg-surface-container-lowest pl-10 pr-3 text-sm text-on-surface outline-none ring-1 ring-transparent focus:ring-primary/20"
                  placeholder="Cari nama produk, SKU, atau barcode..."
                />
              </div>
              <BarcodeScannerButton
                label="Scan"
                onDetected={(value) => {
                  onSearchChange(value);
                  setCurrentPage(1);
                }}
                className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
              />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {["all", ...categoryOptions].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    onCategoryFilterChange(chip);
                    setCurrentPage(1);
                  }}
                  className={
                    categoryFilter === chip
                      ? "whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary"
                      : "whitespace-nowrap rounded-full bg-surface-container-highest px-4 py-2 text-xs font-semibold text-on-surface-variant"
                  }
                >
                  {chip === "all" ? "Semua Item" : normalizeCategoryLabel(chip)}
                </button>
              ))}
            </div>
          </div>
        )}
      </article>

      <section className="grid grid-cols-4 gap-4">
        <article className="rounded-xl bg-surface-container-low p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Total Stock Value</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-primary">Rp {Math.round(totalStockValue).toLocaleString("id-ID")}</p>
        </article>
        <article className="rounded-xl bg-surface-container-low p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Active SKUs</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-primary">{products.length.toLocaleString("id-ID")}</p>
        </article>
        <article className="rounded-xl bg-surface-container-low p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Low Stock Alerts</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-tertiary">{lowStockCount} Items</p>
        </article>
        <article className="rounded-xl border-l-4 border-secondary bg-surface-container-low p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Catalog Health</p>
          <p className="mt-2 font-headline text-3xl font-extrabold text-secondary">{catalogHealth}</p>
        </article>
      </section>

      <article className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-container px-6 py-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={onToggleSelectAllVisible}
              disabled={filteredProductIds.length === 0}
            />
            Pilih semua hasil filter ({filteredProductIds.length})
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRequestBulkDeleteSelected}
              disabled={!canDeleteProduct || selectedProductIds.length === 0}
              className="h-9 rounded-lg bg-error-container px-3 text-xs font-bold text-on-error-container disabled:opacity-40"
            >
              Hapus Terpilih
            </button>
            <button
              type="button"
              onClick={onRequestBulkDeleteFiltered}
              disabled={!canDeleteProduct || filteredProductIds.length === 0}
              className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-bold text-on-surface-variant disabled:opacity-40"
            >
              Hapus Semua
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low/40">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">#</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Product Image</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Details</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Category</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Stock Level</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Price</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                    Produk tidak ditemukan untuk filter saat ini.
                  </td>
                </tr>
              )}

              {pagedFiltered.map((item) => {
                const selected = selectedIdSet.has(item.id);
                const statusTone =
                  item.stock <= 0
                    ? {
                        label: "Out",
                        textClass: "text-error",
                        barClass: "bg-error"
                      }
                    : item.stock <= 5
                      ? {
                          label: "Critical",
                          textClass: "text-error",
                          barClass: "bg-error"
                        }
                      : item.stock <= 15
                        ? {
                            label: "Restock Soon",
                            textClass: "text-tertiary",
                            barClass: "bg-tertiary"
                          }
                        : {
                            label: "Healthy",
                            textClass: "text-secondary",
                            barClass: "bg-secondary"
                          };

                const stockPercent = Math.max(4, Math.round((item.stock / maxStockValue) * 100));

                return (
                  <tr key={item.id} className="group transition-colors hover:bg-surface-container-low/40">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelectProduct(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-14 w-14 overflow-hidden rounded-lg bg-surface-container">
                        <img
                          src={item.imageUrl || DEFAULT_PRODUCT_IMAGE}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-headline text-base font-bold text-on-surface">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">SKU: {item.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-bold text-on-primary-fixed-variant">
                        {normalizeCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid gap-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>{item.stock} units</span>
                          <span className={statusTone.textClass}>{statusTone.label}</span>
                        </div>
                        <span className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-container">
                          <span
                            className={`block h-full ${statusTone.barClass}`}
                            style={{ width: `${Math.min(stockPercent, 100)}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-headline text-lg font-extrabold text-on-surface">Rp {item.price.toLocaleString("id-ID")}</p>
                      {item.promoPercent > 0 && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondary">Promo {item.promoPercent}%</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-primary hover:bg-primary/10"
                          title="Edit product"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRestock(item)}
                          disabled={!canAdjustStock}
                          className="grid h-8 w-8 place-items-center rounded-lg text-secondary hover:bg-secondary/10 disabled:opacity-40"
                          title="Restock +5"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteProduct(item)}
                          disabled={!canDeleteProduct}
                          className="grid h-8 w-8 place-items-center rounded-lg text-error hover:bg-error/10 disabled:opacity-40"
                          title="Delete product"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-surface-container bg-surface-container-low/30 px-6 py-4">
          <p className="text-xs text-on-surface-variant">Showing {fromItem} to {toItem} of {filtered.length} filtered products ({products.length} total)</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={activePage <= 1}
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="grid h-8 min-w-[2rem] place-items-center rounded-lg bg-primary px-2 text-xs font-bold text-on-primary">{activePage}/{totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              disabled={activePage >= totalPages}
              className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </article>

      <section className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        <article className="rounded-2xl bg-surface-container-low p-6">
          <h3 className="font-headline text-2xl font-bold text-on-surface">Catalog Audit Logs</h3>
          <div className="mt-4 grid gap-3">
            {visibleActivityItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-start gap-3 rounded-xl bg-surface-container-lowest p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[18px]">history</span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Update Produk: {item.name}</p>
                  <p className="text-xs text-on-surface-variant">Harga Rp {item.price.toLocaleString("id-ID")} • Stok {item.stock} unit</p>
                </div>
              </div>
            ))}
          </div>
          {filtered.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllActivity((current) => !current)}
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary"
            >
              {showAllActivity ? "Show Less Activity" : "View All Activity"}
              <span className="material-symbols-outlined text-[16px]">{showAllActivity ? "expand_less" : "arrow_forward"}</span>
            </button>
          )}
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-900 to-primary p-6 text-white">
          <h3 className="font-headline text-2xl font-bold">Categories</h3>
          <p className="mt-1 text-xs text-white/70">Inventory concentration</p>

          <div className="mt-6 grid gap-4">
            {categoryConcentration.map((entry) => (
              <div key={entry.category}>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-white/80">
                  <span>{normalizeCategoryLabel(entry.category)}</span>
                  <span>{entry.percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full bg-white" style={{ width: `${entry.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          <span className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </article>
      </section>
    </section>
  );
}
