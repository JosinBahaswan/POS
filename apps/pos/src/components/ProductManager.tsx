import { useMemo, useState } from "react";
import type { ProductCategory, ProductItem } from "../localData";

type ProductManagerProps = {
  products: ProductItem[];
  onUpsert: (product: ProductItem) => void;
  onDelete: (id: string) => void;
};

type FormState = {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: ProductCategory;
  imageUrl: string;
};

const initialState: FormState = {
  id: "",
  barcode: "",
  name: "",
  price: 0,
  stock: 0,
  category: "drink",
  imageUrl: ""
};

const categoryLabels: Record<ProductCategory, string> = {
  drink: "Minuman",
  food: "Makanan"
};

export function ProductManager({ products, onUpsert, onDelete }: ProductManagerProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [editingProductId, setEditingProductId] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ProductCategory>("all");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((item) => {
      const barcode = item.barcode.toLowerCase();
      const matchKeyword =
        keyword.length === 0 ||
        item.name.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        barcode.includes(keyword);
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchKeyword && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const lowStockCount = useMemo(
    () => products.filter((item) => item.stock > 0 && item.stock <= 5).length,
    [products]
  );
  const criticalStockCount = useMemo(
    () => products.filter((item) => item.stock > 0 && item.stock <= 2).length,
    [products]
  );

  const closeForm = () => setIsFormOpen(false);

  const openCreateForm = () => {
    setForm(initialState);
    setEditingProductId("");
    setIsFormOpen(true);
  };

  const submit = () => {
    if (!form.id || !form.name || form.price <= 0) return;

    if (editingProductId && editingProductId !== form.id) {
      onDelete(editingProductId);
    }

    onUpsert({
      id: form.id,
      barcode: form.barcode || form.id,
      name: form.name,
      price: form.price,
      stock: Math.max(0, form.stock),
      category: form.category,
      favorite: false,
      imageUrl:
        form.imageUrl ||
        "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=400&q=80"
    });
    setForm(initialState);
    setEditingProductId("");
    setIsFormOpen(false);
  };

  const resetForm = () => {
    setForm(initialState);
    setEditingProductId("");
  };

  const deleteEditingProduct = () => {
    if (!editingProductId) return;
    onDelete(editingProductId);
    resetForm();
    setIsFormOpen(false);
  };

  const edit = (product: ProductItem) => {
    setEditingProductId(product.id);
    setForm({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl
    });
    setIsFormOpen(true);
  };

  const restock = (product: ProductItem, amount = 5) => {
    onUpsert({ ...product, stock: product.stock + amount });
  };

  return (
    <section className="relative grid gap-4">
      <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <h2 className="font-headline text-2xl font-extrabold text-on-surface">Manajemen Stok</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Monitor dan atur inventaris secara real-time.</p>

        <div className="relative mt-4">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            filter_list
          </span>
          <input
            className="h-12 w-full rounded-xl border-none bg-surface-container-lowest pl-12 pr-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            placeholder="Cari produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { key: "all", label: "Semua Item" },
            { key: "drink", label: "Minuman" },
            { key: "food", label: "Makanan" }
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setCategoryFilter(chip.key as "all" | ProductCategory)}
              className={
                categoryFilter === chip.key
                  ? "whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary"
                  : "whitespace-nowrap rounded-full bg-surface-container-highest px-4 py-2 text-xs font-semibold text-on-surface-variant"
              }
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <article className="rounded-xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Total SKU</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-primary">{products.length}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-secondary">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            +{Math.max(products.length - filtered.length, 0)} tersembunyi filter
          </p>
        </article>

        <article className="rounded-xl border border-error/5 bg-error-container/30 p-4 editorial-shadow">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-error">Stok Menipis</p>
          <p className="mt-1 font-headline text-3xl font-extrabold text-error">{lowStockCount}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-error">
            <span className="material-symbols-outlined text-sm">warning</span>
            {criticalStockCount} kritis
          </p>
        </article>
      </section>

      <section className="space-y-3">
        {filtered.map((item) => {
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
                      event.currentTarget.src = "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=400&q=80";
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
                  <p className="text-xs text-on-surface-variant">{categoryLabels[item.category]}</p>
                  <p className="mt-1 font-headline text-lg font-bold text-primary">Rp {item.price.toLocaleString("id-ID")}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>{statusLabel}</span>
                    {item.stock <= 5 && (
                      <span className="text-xs font-medium text-on-surface-variant">Batas aman: 10 unit</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                <button
                  type="button"
                  onClick={() => restock(item)}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-on-primary"
                >
                  <span className="material-symbols-outlined text-sm">inventory</span>
                  Restok
                </button>
                <button
                  type="button"
                  onClick={() => edit(item)}
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

        {filtered.length === 0 && (
          <article className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
            Produk tidak ditemukan.
          </article>
        )}
      </section>

      <button
        type="button"
        onClick={openCreateForm}
        className="fixed bottom-24 right-6 z-40 grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-90 lg:bottom-8"
        aria-label="Tambah produk"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 px-3 pb-4 pt-20 sm:items-center sm:p-6"
          onClick={closeForm}
        >
          <aside
            className="w-full max-w-xl rounded-2xl bg-surface-container-low p-4 editorial-shadow sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-headline text-xl font-extrabold text-on-surface">
                  {editingProductId ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">Isi data produk lalu simpan perubahan.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-container-high text-on-surface-variant"
                aria-label="Tutup form"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {editingProductId && (
              <p className="mt-3 rounded-xl bg-primary-fixed px-3 py-2 text-xs font-semibold text-on-primary-fixed-variant">
                Mode edit aktif: {editingProductId}
              </p>
            )}

            <form
              className="mt-4 grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Kode produk"
                value={form.id}
                onChange={(e) => setForm((s) => ({ ...s, id: e.target.value.toUpperCase() }))}
              />
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Barcode"
                value={form.barcode}
                onChange={(e) => setForm((s) => ({ ...s, barcode: e.target.value }))}
              />
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Nama produk"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="URL gambar produk"
                value={form.imageUrl}
                onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Harga"
                  value={form.price}
                  onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value || 0) }))}
                />
                <input
                  className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Stok"
                  value={form.stock}
                  onChange={(e) => setForm((s) => ({ ...s, stock: Number(e.target.value || 0) }))}
                />
              </div>

              <select
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as ProductCategory }))}
              >
                <option value="drink">Minuman</option>
                <option value="food">Makanan</option>
              </select>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary"
                >
                  {editingProductId ? "Update Produk" : "Simpan Produk"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-11 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant"
                >
                  Bersihkan
                </button>
              </div>

              {editingProductId && (
                <button
                  type="button"
                  onClick={deleteEditingProduct}
                  className="h-11 rounded-xl bg-error-container text-sm font-semibold text-on-error-container"
                >
                  Hapus Produk
                </button>
              )}
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}
