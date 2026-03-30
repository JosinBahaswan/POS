import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { ProductItem } from "../localData";
import {
  calculateAdvancedHpp,
  createDefaultProductHppProfile,
  sanitizeProductHppProfile
} from "../hpp";
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
  canDeleteProduct: boolean;
  canAdjustStock: boolean;
};

type InfoDialogState = {
  title: string;
  message: string;
  tone: "info" | "error";
};

type DeleteDialogState = {
  ids: string[];
  title: string;
  message: string;
  confirmLabel: string;
};

export function ProductManager({
  products,
  onUpsert,
  onDelete,
  canDeleteProduct,
  canAdjustStock
}: ProductManagerProps) {
  const [form, setForm] = useState<ProductManagerFormState>(productManagerInitialState);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [editingProductId, setEditingProductId] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [opnameTarget, setOpnameTarget] = useState<ProductItem | null>(null);
  const [opnameStock, setOpnameStock] = useState<number>(0);
  const [isOpnameOpen, setIsOpnameOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [infoDialog, setInfoDialog] = useState<InfoDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);

  const createEmptyFormState = (): ProductManagerFormState => ({
    ...productManagerInitialState,
    hppProfile: createDefaultProductHppProfile()
  });

  const selectedIdSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds]);

  useEffect(() => {
    const validIds = new Set(products.map((item) => item.id));
    setSelectedProductIds((current) => current.filter((id) => validIds.has(id)));
  }, [products]);

  const openInfoDialog = (
    title: string,
    message: string,
    tone: "info" | "error" = "info"
  ) => {
    setInfoDialog({ title, message, tone });
  };

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

  const filteredProductIds = useMemo(() => filtered.map((item) => item.id), [filtered]);
  const selectedVisibleCount = useMemo(
    () => filteredProductIds.filter((id) => selectedIdSet.has(id)).length,
    [filteredProductIds, selectedIdSet]
  );
  const allVisibleSelected =
    filteredProductIds.length > 0 && selectedVisibleCount === filteredProductIds.length;

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
    setForm(createEmptyFormState());
    setNewCategoryInput("");
    setEditingProductId("");
    setIsFormOpen(true);
  };

  const submit = () => {
    const normalizedId = form.id.trim().toUpperCase();
    const normalizedName = form.name.trim();
    const normalizedBarcode = form.barcode.trim();

    if (!normalizedId || !normalizedName || form.price <= 0) {
      openInfoDialog(
        "Validasi Produk",
        "Kode produk, nama produk, dan harga jual wajib diisi.",
        "error"
      );
      return;
    }

    const duplicateSku = products.some(
      (item) => item.id === normalizedId && item.id !== editingProductId
    );
    if (duplicateSku) {
      openInfoDialog("Kode Produk Duplikat", "Kode produk sudah dipakai. Gunakan kode lain.", "error");
      return;
    }

    const duplicateBarcode =
      normalizedBarcode.length > 0 &&
      products.some(
        (item) => item.barcode === normalizedBarcode && item.id !== editingProductId
      );
    if (duplicateBarcode) {
      openInfoDialog("Barcode Duplikat", "Barcode sudah digunakan oleh produk lain.", "error");
      return;
    }

    if (editingProductId && editingProductId !== normalizedId && !canDeleteProduct) {
      openInfoDialog(
        "Izin Dibatasi",
        "Owner menonaktifkan izin hapus produk. Kode produk tidak bisa diubah saat ini.",
        "error"
      );
      return;
    }

    const cleanCategory = form.category.trim().toLowerCase() || "uncategorized";
    const normalizedHppProfile =
      form.hppMode === "advanced"
        ? sanitizeProductHppProfile(form.hppProfile, Math.max(0, form.costPrice))
        : undefined;
    const effectiveCostPrice = normalizedHppProfile
      ? calculateAdvancedHpp(normalizedHppProfile).unitHpp
      : Math.max(0, form.costPrice);
    const previousProduct =
      products.find((item) => item.id === editingProductId) ??
      products.find((item) => item.id === normalizedId);

    if (editingProductId && editingProductId !== normalizedId) {
      onDelete(editingProductId);
    }

    onUpsert({
      id: normalizedId,
      barcode: normalizedBarcode || normalizedId,
      name: normalizedName,
      price: Math.max(0, Math.round(form.price)),
      costPrice: effectiveCostPrice,
      hppProfile: normalizedHppProfile,
      promoPercent: Math.max(0, Math.min(100, form.promoPercent)),
      stock: Math.max(0, form.stock),
      category: cleanCategory,
      favorite: previousProduct?.favorite ?? false,
      minStockLevel: previousProduct?.minStockLevel,
      imageUrl: form.imageUrl || DEFAULT_PRODUCT_IMAGE
    });

    setForm(createEmptyFormState());
    setNewCategoryInput("");
    setEditingProductId("");
    setIsFormOpen(false);
  };

  const resetForm = () => {
    setForm(createEmptyFormState());
    setNewCategoryInput("");
    setEditingProductId("");
  };

  const deleteEditingProduct = () => {
    if (!editingProductId) return;
    if (!canDeleteProduct) {
      openInfoDialog(
        "Izin Dibatasi",
        "Owner menonaktifkan izin hapus produk untuk akun ini.",
        "error"
      );
      return;
    }

    const target = products.find((item) => item.id === editingProductId);
    setDeleteDialog({
      ids: [editingProductId],
      title: "Hapus Produk",
      message: `Produk ${target?.name || editingProductId} akan dihapus permanen dari katalog.`,
      confirmLabel: "Hapus Produk"
    });
  };

  const edit = (product: ProductItem) => {
    setEditingProductId(product.id);
    setNewCategoryInput("");

    const normalizedHppProfile = product.hppProfile
      ? sanitizeProductHppProfile(product.hppProfile, product.costPrice)
      : createDefaultProductHppProfile(product.costPrice);

    setForm({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      costPrice: product.costPrice,
      hppMode: product.hppProfile ? "advanced" : "basic",
      hppProfile: normalizedHppProfile,
      promoPercent: product.promoPercent,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl
    });
    setIsFormOpen(true);
  };

  const applyHppSuggestedPrice = () => {
    setForm((state) => {
      const normalizedHppProfile = sanitizeProductHppProfile(
        state.hppProfile,
        Math.max(0, state.costPrice)
      );
      const hppResult = calculateAdvancedHpp(normalizedHppProfile);

      return {
        ...state,
        hppMode: "advanced",
        hppProfile: normalizedHppProfile,
        costPrice: hppResult.unitHpp,
        price: hppResult.suggestedPrice
      };
    });
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((current) => {
      if (current.includes(id)) {
        return current.filter((itemId) => itemId !== id);
      }
      return [...current, id];
    });
  };

  const toggleSelectAllVisible = () => {
    if (filteredProductIds.length === 0) return;

    setSelectedProductIds((current) => {
      const set = new Set(current);

      if (allVisibleSelected) {
        for (const id of filteredProductIds) {
          set.delete(id);
        }
      } else {
        for (const id of filteredProductIds) {
          set.add(id);
        }
      }

      return Array.from(set);
    });
  };

  const openDeleteDialog = (
    ids: string[],
    title: string,
    message: string,
    confirmLabel: string
  ) => {
    if (!canDeleteProduct) {
      openInfoDialog(
        "Izin Dibatasi",
        "Owner menonaktifkan izin hapus produk untuk akun ini.",
        "error"
      );
      return;
    }

    if (ids.length === 0) return;

    setDeleteDialog({
      ids,
      title,
      message,
      confirmLabel
    });
  };

  const confirmDeleteProducts = () => {
    if (!deleteDialog) return;

    const uniqueIds = Array.from(new Set(deleteDialog.ids));
    if (uniqueIds.length === 0) {
      setDeleteDialog(null);
      return;
    }

    for (const id of uniqueIds) {
      onDelete(id);
    }

    const deletedIdSet = new Set(uniqueIds);

    setSelectedProductIds((current) => current.filter((id) => !deletedIdSet.has(id)));

    if (editingProductId && deletedIdSet.has(editingProductId)) {
      resetForm();
      setIsFormOpen(false);
    }

    if (opnameTarget && deletedIdSet.has(opnameTarget.id)) {
      closeOpname();
    }

    setDeleteDialog(null);
  };

  const requestDeleteProduct = (product: ProductItem) => {
    openDeleteDialog(
      [product.id],
      "Hapus Produk",
      `Produk ${product.name} akan dihapus permanen dari katalog.`,
      "Hapus Produk"
    );
  };

  const requestBulkDeleteSelected = () => {
    if (selectedProductIds.length === 0) {
      openInfoDialog("Belum Ada Pilihan", "Pilih beberapa produk dulu sebelum menghapus.");
      return;
    }

    openDeleteDialog(
      selectedProductIds,
      "Hapus Produk Terpilih",
      `${selectedProductIds.length} produk terpilih akan dihapus permanen.`,
      "Hapus Terpilih"
    );
  };

  const requestBulkDeleteFiltered = () => {
    if (filteredProductIds.length === 0) {
      openInfoDialog("Data Kosong", "Tidak ada produk pada filter aktif.");
      return;
    }

    openDeleteDialog(
      filteredProductIds,
      "Hapus Semua Produk Terfilter",
      `${filteredProductIds.length} produk pada hasil filter ini akan dihapus permanen.`,
      "Hapus Semua"
    );
  };

  const adjustStock = (product: ProductItem, delta: number) => {
    if (!canAdjustStock) {
      openInfoDialog(
        "Izin Dibatasi",
        "Owner menonaktifkan izin penyesuaian stok untuk akun ini.",
        "error"
      );
      return;
    }

    const nextStock = Math.max(0, product.stock + delta);
    if (nextStock === product.stock) return;

    onUpsert({ ...product, stock: nextStock });
  };

  const restock = (product: ProductItem, amount = 5) => {
    adjustStock(product, Math.max(1, amount));
  };

  const openOpname = (product: ProductItem) => {
    if (!canAdjustStock) {
      openInfoDialog(
        "Izin Dibatasi",
        "Owner menonaktifkan izin penyesuaian stok untuk akun ini.",
        "error"
      );
      return;
    }

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
    if (!canAdjustStock) {
      openInfoDialog(
        "Izin Dibatasi",
        "Owner menonaktifkan izin penyesuaian stok untuk akun ini.",
        "error"
      );
      return;
    }

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

      <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              disabled={filteredProductIds.length === 0}
            />
            Pilih semua hasil filter ({filteredProductIds.length})
          </label>
          <p className="text-xs text-on-surface-variant">
            Terpilih: {selectedProductIds.length} produk
          </p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={requestBulkDeleteSelected}
            disabled={!canDeleteProduct || selectedProductIds.length === 0}
            className="h-10 rounded-xl bg-error-container text-xs font-bold text-on-error-container disabled:opacity-40"
          >
            Hapus Terpilih
          </button>
          <button
            type="button"
            onClick={requestBulkDeleteFiltered}
            disabled={!canDeleteProduct || filteredProductIds.length === 0}
            className="h-10 rounded-xl bg-surface-container-high text-xs font-bold text-on-surface-variant disabled:opacity-40"
          >
            Hapus Semua Terfilter
          </button>
        </div>

        <p className="mt-2 text-xs text-on-surface-variant">
          Gunakan tombol +/- pada kartu produk untuk menyesuaikan stok cepat. Menu "Opname" tersedia untuk input jumlah aktual.
        </p>
      </section>

      <ProductManagerList
        products={filtered}
        selectedIds={selectedIdSet}
        canDeleteProduct={canDeleteProduct}
        canAdjustStock={canAdjustStock}
        onToggleSelect={toggleSelectProduct}
        onAdjustStock={adjustStock}
        onRestock={restock}
        onOpenOpname={openOpname}
        onEdit={edit}
        onRequestDelete={requestDeleteProduct}
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
        onApplyHppSuggestedPrice={applyHppSuggestedPrice}
      />

      <ProductOpnameModal
        open={isOpnameOpen}
        target={opnameTarget}
        stock={opnameStock}
        onStockChange={setOpnameStock}
        onClose={closeOpname}
        onSubmit={submitOpname}
      />

      <ProductInfoModal
        dialog={infoDialog}
        onClose={() => setInfoDialog(null)}
      />

      <ProductDeleteConfirmModal
        dialog={deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={confirmDeleteProducts}
      />
    </section>
  );
}

type ProductInfoModalProps = {
  dialog: InfoDialogState | null;
  onClose: () => void;
};

function ProductInfoModal({ dialog, onClose }: ProductInfoModalProps) {
  if (!dialog) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/35 px-3 pb-4 pt-20 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-sm rounded-2xl bg-surface-container-low p-4 editorial-shadow"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          className={
            dialog.tone === "error"
              ? "font-headline text-xl font-extrabold text-error"
              : "font-headline text-xl font-extrabold text-on-surface"
          }
        >
          {dialog.title}
        </h3>
        <p className="mt-2 text-sm text-on-surface-variant">{dialog.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 h-10 w-full rounded-xl bg-primary text-sm font-semibold text-on-primary"
        >
          Tutup
        </button>
      </aside>
    </div>
  );
}

type ProductDeleteConfirmModalProps = {
  dialog: DeleteDialogState | null;
  onClose: () => void;
  onConfirm: () => void;
};

function ProductDeleteConfirmModal({
  dialog,
  onClose,
  onConfirm
}: ProductDeleteConfirmModalProps) {
  if (!dialog) return null;

  return (
    <div
      className="fixed inset-0 z-[86] flex items-end justify-center bg-black/35 px-3 pb-4 pt-20 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-sm rounded-2xl bg-surface-container-low p-4 editorial-shadow"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-headline text-xl font-extrabold text-on-surface">{dialog.title}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">{dialog.message}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-xl bg-error-container text-sm font-semibold text-on-error-container"
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}
