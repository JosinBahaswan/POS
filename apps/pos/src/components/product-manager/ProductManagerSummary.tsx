type ProductManagerSummaryProps = {
  totalProducts: number;
  hiddenByFilter: number;
  lowStockCount: number;
  criticalStockCount: number;
};

export function ProductManagerSummary({
  totalProducts,
  hiddenByFilter,
  lowStockCount,
  criticalStockCount
}: ProductManagerSummaryProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <article className="rounded-xl bg-surface-container-lowest p-4 editorial-shadow">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Total SKU</p>
        <p className="mt-1 font-headline text-3xl font-extrabold text-primary">{totalProducts}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-secondary">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          +{hiddenByFilter} tersembunyi filter
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
  );
}
