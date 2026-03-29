import { useMemo, useState, type ChangeEvent } from "react";
import type { ProductItem } from "../localData";
import {
  DEFAULT_PRODUCT_IMAGE,
  ProductEditorModal,
  ProductManagerList,
  ProductManagerSummary,
  ProductManagerToolbar,
  ProductOpnameModal,
  productManagerInitialState,
  type ProductManagerFormState
} from "./product-manager";

type ProductManagerProps = {
  products: ProductItem[];
  onUpsert: (product: ProductItem) => void;
  onDelete: (id: string) => void;
};

export function ProductManager({ products, onUpsert, onDelete }: ProductManagerProps) {
  const [form, setForm] = useState<ProductManagerFormState>(productManagerInitialState);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [editingProductId, setEditingProductId] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [opnameTarget, setOpnameTarget] = useState<ProductItem | null>(null);
  const [opnameStock, setOpnameStock] = useState<number>(0);
  const [isOpnameOpen, setIsOpnameOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(["drink", "food"]);

    for (const item of products) {
      const category = item.category.trim();
      if (category) set.add(category);
    }

    const formCategory = form.category.trim();
    if (formCategory) set.add(formCategory);

    return Array.from(set);
  }, [products, form.category]);

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
    setForm(productManagerInitialState);
    setNewCategoryInput("");
    setEditingProductId("");
    setIsFormOpen(true);
  };

  const submit = () => {
    if (!form.id || !form.name || form.price <= 0) return;

    const cleanCategory = form.category.trim().toLowerCase() || "uncategorized";

    if (editingProductId && editingProductId !== form.id) {
      onDelete(editingProductId);
    }

    onUpsert({
      id: form.id,
      barcode: form.barcode || form.id,
      name: form.name,
      price: form.price,
      costPrice: Math.max(0, form.costPrice),
      promoPercent: Math.max(0, Math.min(100, form.promoPercent)),
      stock: Math.max(0, form.stock),
      category: cleanCategory,
      favorite: false,
      imageUrl: form.imageUrl || DEFAULT_PRODUCT_IMAGE
    });

    setForm(productManagerInitialState);
    setNewCategoryInput("");
    setEditingProductId("");
    setIsFormOpen(false);
  };

  const resetForm = () => {
    setForm(productManagerInitialState);
    setNewCategoryInput("");
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
    setNewCategoryInput("");
    setForm({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      costPrice: product.costPrice,
      promoPercent: product.promoPercent,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl
    });
    setIsFormOpen(true);
  };

  const restock = (product: ProductItem, amount = 5) => {
    onUpsert({ ...product, stock: product.stock + amount });
  };

  const openOpname = (product: ProductItem) => {
    setOpnameTarget(product);
    setOpnameStock(product.stock);
    setIsOpnameOpen(true);
  };

  const closeOpname = () => {
    setIsOpnameOpen(false);
    setOpnameTarget(null);
    setOpnameStock(0);
  };

  const submitOpname = () => {
    if (!opnameTarget) return;
    onUpsert({ ...opnameTarget, stock: Math.max(0, Math.round(opnameStock)) });
    closeOpname();
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setForm((state) => ({ ...state, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const addNewCategory = () => {
    const normalizedCategory = newCategoryInput.trim().toLowerCase();
    if (!normalizedCategory) return;

    setForm((state) => ({ ...state, category: normalizedCategory }));
    setNewCategoryInput("");
  };

  return (
    <section className="relative grid gap-4">
      <ProductManagerToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categoryOptions={categoryOptions}
      />

      <ProductManagerSummary
        totalProducts={products.length}
        hiddenByFilter={Math.max(products.length - filtered.length, 0)}
        lowStockCount={lowStockCount}
        criticalStockCount={criticalStockCount}
      />

      <ProductManagerList
        products={filtered}
        onRestock={restock}
        onOpenOpname={openOpname}
        onEdit={edit}
        onDelete={onDelete}
      />

      <button
        type="button"
        onClick={openCreateForm}
        className="fixed bottom-24 right-6 z-40 grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-90 lg:bottom-8"
        aria-label="Tambah produk"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      <ProductEditorModal
        open={isFormOpen}
        editingProductId={editingProductId}
        form={form}
        setForm={setForm}
        newCategoryInput={newCategoryInput}
        setNewCategoryInput={setNewCategoryInput}
        categoryOptions={categoryOptions}
        onClose={closeForm}
        onSubmit={submit}
        onReset={resetForm}
        onDeleteEditing={deleteEditingProduct}
        onAddNewCategory={addNewCategory}
        onImageUpload={handleImageUpload}
      />

      <ProductOpnameModal
        open={isOpnameOpen}
        target={opnameTarget}
        stock={opnameStock}
        onStockChange={setOpnameStock}
        onClose={closeOpname}
        onSubmit={submitOpname}
      />
    </section>
  );
}
