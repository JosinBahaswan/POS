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

export function ProductManager({ products, onUpsert, onDelete }: ProductManagerProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ProductCategory>("all");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return products.filter((item) => {
      const matchKeyword =
        keyword.length === 0 ||
        item.name.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword) ||
        item.barcode.toLowerCase().includes(keyword);
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchKeyword && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const lowStockCount = useMemo(
    () => products.filter((item) => item.stock > 0 && item.stock <= 5).length,
    [products]
  );

  const submit = () => {
    if (!form.id || !form.name || form.price <= 0) return;
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
  };

  const edit = (product: ProductItem) => {
    setForm({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl
    });
  };

  const restock = (product: ProductItem, amount = 5) => {
    onUpsert({ ...product, stock: product.stock + amount });
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] enter-fade-up">
      <aside className="rounded-3xl bg-surface px-2 py-2 sm:px-3 sm:py-3">
        <div className="rounded-2xl bg-surface-container-low p-4">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface sm:text-4xl">Manajemen Stok</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Pantau dan atur level inventaris secara real-time.</p>

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
                    : "whitespace-nowrap rounded-full bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface-variant"
                }
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Total SKU</p>
              <p className="font-headline text-3xl font-extrabold text-primary sm:text-4xl">{products.length}</p>
              <p className="mt-2 text-sm font-semibold text-on-secondary-container">+12 minggu ini</p>
            </div>
            <div className="rounded-2xl bg-error-container/40 p-4 editorial-shadow">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-error">Stok Menipis</p>
              <p className="font-headline text-3xl font-extrabold text-error sm:text-4xl">{lowStockCount}</p>
              <p className="mt-2 text-sm font-semibold text-error">Perlu tindakan</p>
            </div>
          </div>
        </div>

        <ul className="mt-4 grid gap-3">
          {filtered.map((item) => (
            <li key={item.id} className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
              <div className="flex items-start gap-3">
                <div className="h-20 w-20 overflow-hidden rounded-xl bg-surface-container-low">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full rounded-lg object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-headline text-base font-bold text-on-surface sm:text-xl">{item.name}</h3>
                    <span className="text-xs font-medium uppercase text-outline">SKU: {item.id}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{item.category === "drink" ? "Minuman" : "Makanan"}</p>
                  <p className="mt-1 font-headline text-lg font-bold text-primary sm:text-xl">Rp {item.price.toLocaleString("id-ID")}</p>
                  <span
                    className={
                      item.stock <= 5
                        ? "mt-2 inline-flex rounded-full bg-tertiary-fixed px-2.5 py-1 text-xs font-semibold text-on-tertiary-fixed-variant"
                        : "mt-2 inline-flex rounded-full bg-secondary-container px-2.5 py-1 text-xs font-semibold text-on-secondary-container"
                    }
                  >
                    {item.stock <= 5 ? `Peringatan: tersisa ${item.stock}` : `Tersedia: ${item.stock} unit`}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <button
                  type="button"
                  onClick={() => restock(item)}
                  className="h-11 rounded-xl bg-primary text-sm font-semibold text-on-primary"
                >
                  Restok +5
                </button>
                <button
                  type="button"
                  onClick={() => edit(item)}
                  className="h-11 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface-variant"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="h-11 rounded-xl bg-error-container px-3 text-xs font-semibold text-on-error-container"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}

          {filtered.length === 0 && (
            <li className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
              Produk tidak ditemukan.
            </li>
          )}
        </ul>
      </aside>

      <aside className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <h2 className="font-headline text-2xl font-extrabold text-on-surface">Tambah atau Edit Produk</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Update informasi produk dari panel ini.</p>

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

          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary"
            >
              Simpan Produk
            </button>
            <button
              type="button"
              onClick={() => setForm(initialState)}
              className="h-11 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant"
            >
              Bersihkan Form
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}
