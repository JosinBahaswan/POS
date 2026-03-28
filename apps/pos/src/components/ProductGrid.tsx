import { useMemo, useState } from "react";
import type { ProductItem } from "../localData";

type ProductGridProps = {
  products: ProductItem[];
  onAdd: (id: string, name: string, price: number) => void;
};

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "favorite" | "drink" | "food">("all");

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchText =
        product.name.toLowerCase().includes(keyword) ||
        product.id.toLowerCase().includes(keyword) ||
        product.barcode.toLowerCase().includes(keyword);

      const matchFilter =
        filter === "all" ||
        (filter === "favorite" && product.favorite) ||
        product.category === filter;

      return matchText && matchFilter;
    });
  }, [products, query, filter]);

  return (
    <section className="space-y-4 rounded-3xl bg-surface px-2 py-2 sm:px-4 sm:py-4">
      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
          search
        </span>
        <input
          className="h-14 w-full rounded-2xl border-none bg-surface-container-low pl-12 pr-4 text-sm text-on-surface outline-none transition placeholder:text-outline/70 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
          type="text"
          placeholder="Cari nama produk atau SKU..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {[
          { key: "all", label: "Semua Item" },
          { key: "favorite", label: "Favorit" },
          { key: "drink", label: "Minuman" },
          { key: "food", label: "Makanan" }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key as "all" | "favorite" | "drink" | "food")}
            className={
              filter === item.key
                ? "whitespace-nowrap rounded-full bg-primary-container px-4 py-2 text-sm font-semibold text-white"
                : "whitespace-nowrap rounded-full bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface-variant"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const stockState =
            product.stock <= 0
              ? {
                  label: "Habis",
                  badgeClass: "bg-error-container text-on-error-container",
                  helperClass: "text-error"
                }
              : product.stock <= 5
                ? {
                    label: "Stok menipis",
                    badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
                    helperClass: "text-error"
                  }
                : {
                    label: "Tersedia",
                    badgeClass: "bg-secondary-container text-on-secondary-container",
                    helperClass: "text-on-surface-variant"
                  };

          return (
            <article
              className="min-w-0 overflow-hidden rounded-2xl bg-surface-container-lowest editorial-shadow enter-fade-up lift-hover transition-transform active:scale-[0.99]"
              key={product.id}
            >
              <div className="relative aspect-square overflow-hidden bg-surface-container-low">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=400&q=80";
                  }}
                />
                <span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${stockState.badgeClass}`}>
                  {stockState.label}
                </span>
              </div>

              <div className="space-y-1 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">
                  {product.category === "drink" ? "MINUMAN" : "MAKANAN"}
                </p>
                <p className="min-h-[2.5rem] text-base font-headline font-bold leading-[1.2] text-on-surface sm:text-lg">
                  {product.name}
                </p>

                <div className="flex items-end justify-between gap-2 pt-1">
                  <div>
                    <p className={`text-xs font-medium ${stockState.helperClass}`}>
                      {product.stock > 0 ? `${product.stock} tersisa` : "Tidak tersedia"}
                    </p>
                    <p className="font-headline text-lg font-extrabold text-primary sm:text-xl">Rp {product.price.toLocaleString("id-ID")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(product.id, product.name, product.price)}
                    disabled={product.stock <= 0}
                    className={product.stock <= 0 ? "grid h-10 w-10 place-items-center rounded-xl bg-surface-container-high text-outline" : "grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition hover:brightness-105 active:scale-95"}
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
          <p className="col-span-2 rounded-2xl bg-surface-container-low px-4 py-5 text-sm text-on-surface-variant sm:col-span-3 xl:col-span-4">
            Produk tidak ditemukan.
          </p>
        )}
      </div>
    </section>
  );
}
