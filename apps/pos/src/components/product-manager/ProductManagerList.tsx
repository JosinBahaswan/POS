import type { ProductItem } from "../../localData";
import { resolveEffectiveCostPrice } from "../../hpp";
import { DEFAULT_PRODUCT_IMAGE, normalizeCategoryLabel } from "./types";

type ProductManagerListProps = {
  products: ProductItem[];
  selectedIds: Set<string>;
  canDeleteProduct: boolean;
  canAdjustStock: boolean;
  onToggleSelect: (id: string) => void;
  onAdjustStock: (product: ProductItem, delta: number) => void;
  onRestock: (product: ProductItem) => void;
  onOpenOpname: (product: ProductItem) => void;
  onEdit: (product: ProductItem) => void;
  onRequestDelete: (product: ProductItem) => void;
};

export function ProductManagerList({
  products,
  selectedIds,
  canDeleteProduct,
  canAdjustStock,
  onToggleSelect,
  onAdjustStock,
  onRestock,
  onOpenOpname,
  onEdit,
  onRequestDelete
}: ProductManagerListProps) {
  if (products.length === 0) {
    return (
      <article className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
        Produk tidak ditemukan.
      </article>
    );
  }

  return (
    <section className="space-y-3">
      {products.map((item) => {
        const promoPercent = Math.max(0, Math.min(100, item.promoPercent));
        const finalPrice = Math.round(item.price * (1 - promoPercent / 100));
        const effectiveCostPrice = resolveEffectiveCostPrice(item);
        const unitMargin = finalPrice - effectiveCostPrice;
        const isCritical = item.stock > 0 && item.stock <= 2;
        const isWarning = item.stock > 2 && item.stock <= 5;
        const marginClass = unitMargin < 0 ? "text-error" : "text-on-surface-variant";
        const marginLabel = `${unitMargin < 0 ? "-" : ""}Rp ${Math.abs(Math.round(unitMargin)).toLocaleString("id-ID")}`;
        const isSelected = selectedIds.has(item.id);
        const statusClass = isCritical
          ? "bg-error-container text-on-error-container"
          : isWarning
            ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
            : "bg-secondary-container text-on-secondary-container";
        const statusLabel = isCritical
          ? `Kritis: ${item.stock} tersisa`
          : isWarning
            ? `Peringatan: ${item.stock} tersisa`
            : `Tersedia: ${item.stock} unit`;

        return (
          <article
            key={item.id}
            className={`rounded-xl p-4 editorial-shadow transition-transform active:scale-[0.98] ${
              isSelected
                ? "bg-primary-fixed ring-2 ring-primary/40"
                : "bg-surface-container-lowest"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-2 py-1 text-xs font-semibold text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(item.id)}
                />
                Pilih
              </label>
              <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                SKU: {item.id}
              </span>
            </div>

            <div className="mt-2 flex gap-4">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-headline text-base font-bold text-on-surface">{item.name}</h3>
                </div>
                <p className="text-xs text-on-surface-variant">{normalizeCategoryLabel(item.category)}</p>
                {promoPercent > 0 && (
                  <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                    <span className="line-through">Rp {item.price.toLocaleString("id-ID")}</span>
                    {` • Promo ${promoPercent}%`}
                  </p>
                )}
                <p className="font-headline text-lg font-bold text-primary">Rp {finalPrice.toLocaleString("id-ID")}</p>
                <p className={`text-xs ${marginClass}`}>
                  HPP: Rp {effectiveCostPrice.toLocaleString("id-ID")} • Margin/unit: {marginLabel}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>{statusLabel}</span>
                  {item.hppProfile && (
                    <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-on-primary-fixed-variant">
                      HPP Advanced
                    </span>
                  )}
                  {item.stock <= 5 && (
                    <span className="text-xs font-medium text-on-surface-variant">Batas aman: 10 unit</span>
                  )}
                </div>

                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-surface-container-low px-2 py-1">
                  <button
                    type="button"
                    onClick={() => onAdjustStock(item, -1)}
                    disabled={!canAdjustStock || item.stock <= 0}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-high text-on-surface disabled:opacity-40"
                    aria-label={`Kurangi stok ${item.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                  <p className="min-w-12 text-center text-sm font-bold text-on-surface">{item.stock}</p>
                  <button
                    type="button"
                    onClick={() => onAdjustStock(item, 1)}
                    disabled={!canAdjustStock}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-high text-on-surface disabled:opacity-40"
                    aria-label={`Tambah stok ${item.name}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRestock(item)}
                    disabled={!canAdjustStock}
                    className="h-8 rounded-lg bg-primary px-2.5 text-[11px] font-bold text-on-primary disabled:opacity-40"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => onRestock(item)}
                disabled={!canAdjustStock}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-on-primary disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">inventory</span>
                Restok
              </button>
              <button
                type="button"
                onClick={() => onOpenOpname(item)}
                disabled={!canAdjustStock}
                className="h-10 rounded-lg bg-secondary-container px-3 text-xs font-bold text-on-secondary-container disabled:opacity-40"
              >
                Opname
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="h-10 rounded-lg bg-surface-container-highest px-3 text-xs font-bold text-on-surface-variant"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(item)}
                disabled={!canDeleteProduct}
                className="h-10 rounded-lg bg-error-container px-3 text-xs font-bold text-on-error-container disabled:opacity-40"
                aria-label={`Hapus ${item.name}`}
              >
                Hapus
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
