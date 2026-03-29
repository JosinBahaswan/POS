import type { ProductItem } from "../../localData";

type ProductOpnameModalProps = {
  open: boolean;
  target: ProductItem | null;
  stock: number;
  onStockChange: (value: number) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ProductOpnameModal({
  open,
  target,
  stock,
  onStockChange,
  onClose,
  onSubmit
}: ProductOpnameModalProps) {
  if (!open || !target) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/30 px-3 pb-4 pt-20 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md rounded-2xl bg-surface-container-low p-4 editorial-shadow sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-headline text-xl font-extrabold text-on-surface">Stok Opname</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          {target.name} ({target.id})
        </p>

        <div className="mt-4 grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Stok Aktual</label>
          <input
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            type="number"
            min={0}
            value={stock}
            onChange={(event) => onStockChange(Number(event.target.value || 0))}
          />
          <p className="text-xs text-on-surface-variant">
            Stok sistem saat ini: {target.stock} unit
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="h-11 rounded-xl bg-primary text-sm font-semibold text-on-primary"
          >
            Simpan Opname
          </button>
        </div>
      </aside>
    </div>
  );
}
