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
    <section className="space-y-5">
      <div className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="relative group">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="h-11 w-full rounded-xl border-none bg-surface-container-low py-3 pl-12 pr-4 text-sm font-medium text-on-surface outline-none transition placeholder:text-outline/60 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
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
            className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 hide-scrollbar">
          {categoryOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={
                filter === item
                  ? "whitespace-nowrap rounded-full bg-primary-container px-4 py-1.5 text-xs font-semibold text-white"
                  : "whitespace-nowrap rounded-full bg-surface-container-highest px-4 py-1.5 text-xs font-semibold text-on-surface-variant"
              }
            >
              {normalizeCategoryLabel(item)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
              className="group min-w-0 overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md active:scale-95 border border-transparent hover:border-outline-variant/30"
              key={product.id}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
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
                <span className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${stockState.badgeClass}`}>
                  {stockState.label}
                </span>
              </div>

              <div className="p-3">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-outline">{categoryLabel}</p>
                <p className="mb-2 line-clamp-2 min-h-[2.25rem] font-headline text-sm font-bold leading-tight text-on-surface">
                  {product.name}
                </p>

                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className={`mb-0.5 text-[9px] font-medium ${stockState.helperClass}`}>
                      {product.stock > 0 ? `${product.stock} tersisa` : "Tidak tersedia"}
                    </p>
                    <p className="font-headline text-base font-extrabold text-primary">Rp {effectivePrice.toLocaleString("id-ID")}</p>
                    {promoPercent > 0 && (
                      <p className="text-[9px] font-semibold text-on-surface-variant">
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
                        ? "grid h-9 w-9 place-items-center rounded-lg bg-surface-container-high text-outline"
                        : "grid h-9 w-9 place-items-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-90"
                    }
                    aria-label={`Tambah ${product.name}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-2 sm:col-span-3 xl:col-span-4 flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-surface-container-high/50 text-outline-variant mb-4">
               <span className="material-symbols-outlined text-[48px] opacity-50">search_off</span>
            </div>
            <h3 className="font-headline text-lg font-bold text-on-surface mb-1">Produk tidak ditemukan</h3>
            <p className="text-sm text-on-surface-variant max-w-sm">
              Coba gunakan kata kunci lain atau periksa kembali ejaan pencarian Anda.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
