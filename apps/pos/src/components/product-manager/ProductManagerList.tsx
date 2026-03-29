import type { ProductItem } from "../../localData";
import { DEFAULT_PRODUCT_IMAGE, normalizeCategoryLabel } from "./types";

type ProductManagerListProps = {
  products: ProductItem[];
  onRestock: (product: ProductItem) => void;
  onOpenOpname: (product: ProductItem) => void;
  onEdit: (product: ProductItem) => void;
  onDelete: (id: string) => void;
};

export function ProductManagerList({
  products,
  onRestock,
  onOpenOpname,
  onEdit,
  onDelete
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
        const unitMargin = Math.max(finalPrice - item.costPrice, 0);
        const isCritical = item.stock > 0 && item.stock <= 2;
        const isWarning = item.stock > 2 && item.stock <= 5;
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
            className="rounded-xl bg-surface-container-lowest p-4 editorial-shadow transition-transform active:scale-[0.98]"
          >
            <div className="flex gap-4">
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
                  <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-outline">
                    SKU: {item.id}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">{normalizeCategoryLabel(item.category)}</p>
                {promoPercent > 0 && (
                  <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                    <span className="line-through">Rp {item.price.toLocaleString("id-ID")}</span>
                    {` • Promo ${promoPercent}%`}
                  </p>
                )}
                <p className="font-headline text-lg font-bold text-primary">Rp {finalPrice.toLocaleString("id-ID")}</p>
                <p className="text-xs text-on-surface-variant">
                  HPP: Rp {item.costPrice.toLocaleString("id-ID")} • Margin/unit: Rp {unitMargin.toLocaleString("id-ID")}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>{statusLabel}</span>
                  {item.stock <= 5 && (
                    <span className="text-xs font-medium text-on-surface-variant">Batas aman: 10 unit</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => onRestock(item)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-on-primary"
              >
                <span className="material-symbols-outlined text-sm">inventory</span>
                Restok
              </button>
              <button
                type="button"
                onClick={() => onOpenOpname(item)}
                className="h-10 rounded-lg bg-secondary-container px-3 text-xs font-bold text-on-secondary-container"
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
                onClick={() => onDelete(item.id)}
                className="h-10 rounded-lg bg-error-container px-3 text-xs font-bold text-on-error-container"
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
