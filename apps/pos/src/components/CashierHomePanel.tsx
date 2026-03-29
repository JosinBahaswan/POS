type CashierHomePanelProps = {
  cartItemCount: number;
  heldOrderCount: number;
  todaySalesCount: number;
  todayRevenue: number;
};

export function CashierHomePanel({
  cartItemCount,
  heldOrderCount,
  todaySalesCount,
  todayRevenue
}: CashierHomePanelProps) {
  return (
    <section className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Role Workspace</p>
      <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl">Menu Kasir</h2>
      <p className="mt-1 text-sm text-on-surface-variant">Ringkasan operasional kasir hari ini.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-2xl bg-surface-container-lowest p-3 editorial-shadow">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Item Keranjang</p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-primary">{cartItemCount}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-3 editorial-shadow">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Order Tahan</p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{heldOrderCount}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-3 editorial-shadow">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Transaksi Hari Ini</p>
          <p className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{todaySalesCount}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-3 editorial-shadow">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Omzet Hari Ini</p>
          <p className="mt-1 font-headline text-base font-extrabold text-on-surface">Rp {todayRevenue.toLocaleString("id-ID")}</p>
        </article>
      </div>
    </section>
  );
}