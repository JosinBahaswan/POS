import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { calculateAdvancedHpp, sanitizeProductHppProfile } from "../../hpp";
import { BarcodeScannerButton } from "../BarcodeScannerButton";
import {
  DEFAULT_PRODUCT_IMAGE,
  normalizeCategoryLabel,
  type ProductManagerFormState
} from "./types";

type ProductEditorModalProps = {
  open: boolean;
  editingProductId: string;
  form: ProductManagerFormState;
  setForm: Dispatch<SetStateAction<ProductManagerFormState>>;
  newCategoryInput: string;
  setNewCategoryInput: Dispatch<SetStateAction<string>>;
  categoryOptions: string[];
  onClose: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onDeleteEditing: () => void;
  onAddNewCategory: () => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onApplyHppSuggestedPrice: () => void;
};

export function ProductEditorModal({
  open,
  editingProductId,
  form,
  setForm,
  newCategoryInput,
  setNewCategoryInput,
  categoryOptions,
  onClose,
  onSubmit,
  onReset,
  onDeleteEditing,
  onAddNewCategory,
  onImageUpload,
  onApplyHppSuggestedPrice
}: ProductEditorModalProps) {
  if (!open) return null;

  const normalizedHppProfile = sanitizeProductHppProfile(
    form.hppProfile,
    Math.max(0, form.costPrice)
  );
  const hppPreview = calculateAdvancedHpp(normalizedHppProfile);
  const promoPercent = Math.max(0, Math.min(100, form.promoPercent));
  const discountedPrice = Math.round(form.price * (1 - promoPercent / 100));
  const effectiveCostPrice = form.hppMode === "advanced" ? hppPreview.unitHpp : Math.max(0, form.costPrice);
  const unitMargin = discountedPrice - effectiveCostPrice;
  const unitMarginLabel = `${unitMargin < 0 ? "-" : ""}Rp ${Math.abs(Math.round(unitMargin)).toLocaleString("id-ID")}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 px-3 pb-4 pt-20 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <aside
        className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-low p-3 editorial-shadow sm:max-w-xl sm:p-5"
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
            onClick={onClose}
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
          className="mt-4 grid max-h-[68vh] gap-2 overflow-y-auto pr-1 sm:max-h-[70vh] sm:pr-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid gap-1">
            <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              Kode Produk
            </label>
            <input
              className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
              placeholder="Contoh: PRD-010"
              value={form.id}
              onChange={(event) => setForm((state) => ({ ...state, id: event.target.value.toUpperCase() }))}
            />
          </div>

          <div className="grid gap-1">
            <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              Barcode Produk
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Scan atau ketik barcode"
                value={form.barcode}
                onChange={(event) => setForm((state) => ({ ...state, barcode: event.target.value }))}
              />
              <BarcodeScannerButton
                label="Scan"
                onDetected={(barcode) => setForm((state) => ({ ...state, barcode }))}
                className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              Nama Produk
            </label>
            <input
              className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
              placeholder="Contoh: Espresso Double"
              value={form.name}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            />
          </div>

          <div className="grid gap-2 rounded-xl bg-surface-container-lowest p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Gambar Produk</p>
            <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
              <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-surface-container-high px-4 text-xs font-semibold text-on-surface-variant">
                Upload File
                <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
              </label>
              <input
                className="h-11 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Atau tempel URL gambar (opsional)"
                value={form.imageUrl}
                onChange={(event) => setForm((state) => ({ ...state, imageUrl: event.target.value }))}
              />
            </div>
            <div className="h-24 w-24 overflow-hidden rounded-lg bg-surface-container">
              <img
                src={form.imageUrl || DEFAULT_PRODUCT_IMAGE}
                alt="Preview produk"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Harga Jual (Rp)
              </label>
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                type="number"
                min={0}
                placeholder="0"
                value={form.price}
                onChange={(event) => setForm((state) => ({ ...state, price: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="grid gap-1">
              <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Stok Awal (Unit)
              </label>
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                type="number"
                min={0}
                placeholder="0"
                value={form.stock}
                onChange={(event) => setForm((state) => ({ ...state, stock: Number(event.target.value || 0) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Promo Diskon (%)
              </label>
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                type="number"
                min={0}
                max={100}
                placeholder="0"
                value={form.promoPercent}
                onChange={(event) => setForm((state) => ({ ...state, promoPercent: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="grid gap-1">
              <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Mode HPP</label>
              <div className="grid h-11 grid-cols-2 gap-1 rounded-xl bg-surface-container p-1">
                <button
                  type="button"
                  onClick={() => setForm((state) => ({ ...state, hppMode: "basic" }))}
                  className={
                    form.hppMode === "basic"
                      ? "rounded-lg bg-primary text-xs font-semibold text-on-primary"
                      : "rounded-lg text-xs font-semibold text-on-surface-variant"
                  }
                >
                  Basic
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((state) => ({
                      ...state,
                      hppMode: "advanced",
                      hppProfile: {
                        ...state.hppProfile,
                        materialCost:
                          state.hppProfile.materialCost > 0
                            ? state.hppProfile.materialCost
                            : Math.max(0, state.costPrice)
                      }
                    }))
                  }
                  className={
                    form.hppMode === "advanced"
                      ? "rounded-lg bg-primary text-xs font-semibold text-on-primary"
                      : "rounded-lg text-xs font-semibold text-on-surface-variant"
                  }
                >
                  Advanced
                </button>
              </div>
              <p className="px-1 text-[11px] text-on-surface-variant">
                Basic: isi 1 nilai HPP langsung. Advanced: hitung HPP otomatis dari komponen biaya + susut + pajak, lalu sistem beri harga jual saran sesuai target margin.
              </p>
            </div>
          </div>

          {form.hppMode === "basic" ? (
            <div className="grid gap-1">
              <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Harga Modal / HPP (Rp)
              </label>
              <input
                className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                type="number"
                min={0}
                placeholder="0"
                value={form.costPrice}
                onChange={(event) => setForm((state) => ({ ...state, costPrice: Number(event.target.value || 0) }))}
              />
            </div>
          ) : (
            <div className="grid gap-2 rounded-xl bg-surface-container-lowest p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Komponen HPP Advanced
              </p>
              <div className="rounded-xl bg-surface-container p-3 text-xs text-on-surface-variant">
                <p>
                  Keterangan: total biaya dasar dihitung dari bahan baku + tenaga kerja + overhead + kemasan + logistik + biaya lain.
                </p>
                <p className="mt-1">
                  Rumus: HPP final = biaya dasar + susut + pajak biaya. Harga saran mengikuti target margin dan pembulatan harga.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Bahan baku (Rp)"
                  value={form.hppProfile.materialCost}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, materialCost: Number(event.target.value || 0) }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Tenaga kerja (Rp)"
                  value={form.hppProfile.laborCost}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, laborCost: Number(event.target.value || 0) }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Overhead (Rp)"
                  value={form.hppProfile.overheadCost}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, overheadCost: Number(event.target.value || 0) }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Kemasan (Rp)"
                  value={form.hppProfile.packagingCost}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, packagingCost: Number(event.target.value || 0) }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Logistik (Rp)"
                  value={form.hppProfile.logisticsCost}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, logisticsCost: Number(event.target.value || 0) }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  placeholder="Biaya lain (Rp)"
                  value={form.hppProfile.otherCost}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, otherCost: Number(event.target.value || 0) }
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Susut (%)"
                  value={form.hppProfile.wastagePercent}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, wastagePercent: Number(event.target.value || 0) }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Pajak biaya (%)"
                  value={form.hppProfile.taxPercent}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, taxPercent: Number(event.target.value || 0) }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={0}
                  max={95}
                  placeholder="Target margin (%)"
                  value={form.hppProfile.targetMarginPercent}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: {
                        ...state.hppProfile,
                        targetMarginPercent: Number(event.target.value || 0)
                      }
                    }))
                  }
                />
                <input
                  className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  type="number"
                  min={1}
                  step={50}
                  placeholder="Pembulatan harga (Rp)"
                  value={form.hppProfile.priceRounding}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      hppProfile: { ...state.hppProfile, priceRounding: Number(event.target.value || 0) }
                    }))
                  }
                />
              </div>

              <div className="rounded-xl bg-surface-container p-3 text-xs text-on-surface-variant">
                <p>Biaya dasar: Rp {hppPreview.baseCost.toLocaleString("id-ID")}</p>
                <p>Biaya susut: Rp {hppPreview.wastageCost.toLocaleString("id-ID")}</p>
                <p>Biaya pajak: Rp {hppPreview.taxCost.toLocaleString("id-ID")}</p>
                <p>HPP final per unit: Rp {hppPreview.unitHpp.toLocaleString("id-ID")}</p>
                <p>
                  Harga jual saran (margin {normalizedHppProfile.targetMarginPercent}%): Rp {hppPreview.suggestedPrice.toLocaleString("id-ID")}
                </p>
                <button
                  type="button"
                  onClick={onApplyHppSuggestedPrice}
                  className="mt-2 h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary"
                >
                  Gunakan harga saran
                </button>
              </div>
            </div>
          )}

          <p className={`text-xs ${unitMargin < 0 ? "text-error" : "text-on-surface-variant"}`}>
            Harga setelah promo: Rp {discountedPrice.toLocaleString("id-ID")} • HPP: Rp {effectiveCostPrice.toLocaleString("id-ID")} • Margin/unit: {unitMarginLabel}
          </p>

          <div className="grid gap-1">
            <label className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              Kategori Produk
            </label>
            <input
              className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
              value={form.category}
              onChange={(event) => setForm((state) => ({ ...state, category: event.target.value }))}
              placeholder="Contoh: drink, food, pastry, snack"
              list="product-category-options"
            />
            <datalist id="product-category-options">
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {normalizeCategoryLabel(category)}
                </option>
              ))}
            </datalist>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                className="h-10 rounded-xl border-none bg-surface-container px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Tambah kategori baru"
                value={newCategoryInput}
                onChange={(event) => setNewCategoryInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  onAddNewCategory();
                }}
              />
              <button
                type="button"
                onClick={onAddNewCategory}
                className="h-10 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
              >
                Tambah
              </button>
            </div>
            <p className="px-1 text-xs text-on-surface-variant">
              Kategori aktif: <span className="font-semibold text-on-surface">{normalizeCategoryLabel(form.category)}</span>
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary"
            >
              {editingProductId ? "Update Produk" : "Simpan Produk"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="h-11 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant"
            >
              Bersihkan
            </button>
          </div>

          {editingProductId && (
            <button
              type="button"
              onClick={onDeleteEditing}
              className="h-11 rounded-xl bg-error-container text-sm font-semibold text-on-error-container"
            >
              Hapus Produk
            </button>
          )}
        </form>
      </aside>
    </div>
  );
}
