import { useMemo, useState } from "react";
import { BarcodeScannerButton } from "./BarcodeScannerButton";
import type { ProductItem } from "../localData";

const FALLBACK_PRODUCT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e5e8ee'/%3E%3Cstop offset='1' stop-color='%23dfe3e8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23g)'/%3E%3Ccircle cx='200' cy='160' r='54' fill='%23bfc8cd'/%3E%3Crect x='110' y='238' width='180' height='26' rx='13' fill='%23bfc8cd'/%3E%3C/svg%3E";

type ProductGridProps = {
  products: ProductItem[];
  onAdd: (id: string, name: string, price: number) => void;
};

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      const category = product.category.trim();
      if (category) set.add(category);
    }

    return ["all", ...Array.from(set)];
  }, [products]);

  const normalizeCategoryLabel = (value: string) => {
    if (value === "all") return "Semua Item";

    return value
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchText =
        product.name.toLowerCase().includes(keyword) ||
        product.id.toLowerCase().includes(keyword) ||
        product.barcode.toLowerCase().includes(keyword);

      const matchFilter = filter === "all" || product.category === filter;

      return matchText && matchFilter;
    });
  }, [products, query, filter]);

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="relative group">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="h-12 w-full rounded-xl border-none bg-surface-container-low py-4 pl-12 pr-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-outline/60 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
              type="text"
              placeholder="Cari nama produk atau SKU..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <BarcodeScannerButton
            label="Scan"
            onDetected={(barcode) => {
              setQuery(barcode);
            }}
            className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {categoryOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={
                filter === item
                  ? "whitespace-nowrap rounded-full bg-primary-container px-6 py-2 text-sm font-semibold text-white"
                  : "whitespace-nowrap rounded-full bg-surface-container-highest px-6 py-2 text-sm font-semibold text-on-surface-variant"
              }
            >
              {normalizeCategoryLabel(item)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const promoPercent = Math.max(0, Math.min(100, Number(product.promoPercent || 0)));
          const effectivePrice = Math.round(product.price * (1 - promoPercent / 100));
          const stockState =
            product.stock <= 0
              ? {
                  label: "Habis",
                  badgeClass: "bg-error-container text-on-error-container",
                  helperClass: "text-error"
                }
              : product.stock <= 5
                ? {
                    label: "Stok Menipis",
                    badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
                    helperClass: "text-error"
                  }
                : {
                    label: "Tersedia",
                    badgeClass: "bg-secondary-container text-on-secondary-container",
                    helperClass: "text-on-surface-variant"
                  };

          const categoryLabel = normalizeCategoryLabel(product.category);

          return (
            <article
              className="group min-w-0 overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98]"
              key={product.id}
            >
              <div className="relative aspect-square overflow-hidden bg-surface-container">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="absolute inset-0 block h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                  }}
                />
                <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${stockState.badgeClass}`}>
                  {stockState.label}
                </span>
              </div>

              <div className="p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-outline">{categoryLabel}</p>
                <p className="mb-2 line-clamp-2 min-h-[2.5rem] font-headline text-base font-bold leading-tight text-on-surface">
                  {product.name}
                </p>

                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className={`mb-0.5 text-[10px] font-medium ${stockState.helperClass}`}>
                      {product.stock > 0 ? `${product.stock} tersisa` : "Tidak tersedia"}
                    </p>
                    <p className="font-headline text-lg font-extrabold text-primary">Rp {effectivePrice.toLocaleString("id-ID")}</p>
                    {promoPercent > 0 && (
                      <p className="text-[10px] font-semibold text-on-surface-variant">
                        <span className="line-through">Rp {product.price.toLocaleString("id-ID")}</span>
                        {` • Promo ${promoPercent}%`}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(product.id, product.name, effectivePrice)}
                    disabled={product.stock <= 0}
                    className={
                      product.stock <= 0
                        ? "grid h-10 w-10 place-items-center rounded-xl bg-surface-container-high text-outline"
                        : "grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-90"
                    }
                    aria-label={`Tambah ${product.name}`}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {filteredProducts.length === 0 && (
          <p className="col-span-2 rounded-xl bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant sm:col-span-3 xl:col-span-4">
            Produk tidak ditemukan.
          </p>
        )}
      </div>
    </section>
  );
}
