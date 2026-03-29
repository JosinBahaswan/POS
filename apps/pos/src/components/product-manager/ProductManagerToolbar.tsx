import { BarcodeScannerButton } from "../BarcodeScannerButton";
import { normalizeCategoryLabel } from "./types";

type ProductManagerToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: string[];
};

export function ProductManagerToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions
}: ProductManagerToolbarProps) {
  return (
    <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
      <h2 className="font-headline text-2xl font-extrabold text-on-surface">Manajemen Stok</h2>
      <p className="mt-1 text-sm text-on-surface-variant">Monitor dan atur inventaris secara real-time.</p>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="relative">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            filter_list
          </span>
          <input
            className="h-12 w-full rounded-xl border-none bg-surface-container-lowest pl-12 pr-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            placeholder="Cari produk atau SKU..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <BarcodeScannerButton
          label="Scan"
          onDetected={onSearchChange}
          className="inline-flex h-12 items-center justify-center gap-1 rounded-xl bg-surface-container-high px-3 text-xs font-semibold text-on-surface"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {["all", ...categoryOptions].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onCategoryFilterChange(chip)}
            className={
              categoryFilter === chip
                ? "whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary"
                : "whitespace-nowrap rounded-full bg-surface-container-highest px-4 py-2 text-xs font-semibold text-on-surface-variant"
            }
          >
            {chip === "all" ? "Semua Item" : normalizeCategoryLabel(chip)}
          </button>
        ))}
      </div>
    </section>
  );
}
