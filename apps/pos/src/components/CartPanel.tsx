import type { Customer, CartItem, PaymentBreakdown, PaymentMethod } from "../types";

type CartPanelProps = {
  cart: CartItem[];
  stockByProductId?: Record<string, number>;
  customers?: Customer[];
  selectedCustomerId?: string;
  selectedCustomerLoyaltyPoints: number;
  selectedCustomerMemberTier?: Customer["member_tier"];
  selectedCustomerLoyaltyMultiplier: number;
  estimatedEarnedPoints: number;
  selectedCustomerOutstandingDebt: number;
  loyaltyPointValue: number;
  redeemedPoints: number;
  loyaltyRedeemAmount: number;
  maxRedeemablePoints: number;
  onSelectCustomer?: (id: string | undefined) => void;
  onRedeemedPointsChange: (value: number) => void;
  pendingDraft?: {
    updatedAt: string;
    itemCount: number;
    subtotal: number;
  } | null;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  estimatedCost: number;
  grossProfit: number;
  grossMarginPercent: number | null;
  hasNegativeMargin: boolean;
  projectedLossAmount: number;
  discountApprovalThreshold: number;
  minimumMarginThreshold: number;
  isBelowMinimumMarginThreshold: boolean;
  isShiftOpen: boolean;
  checkoutApprovalHint?: string;
  paymentMethod: PaymentMethod;
  isSplitPayment: boolean;
  splitPayment: PaymentBreakdown;
  cashReceived: number;
  changeAmount: number;
  onDiscountChange: (value: number) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onSplitPaymentToggle: (enabled: boolean) => void;
  onSplitPaymentAmountChange: (method: PaymentMethod, value: number) => void;
  onApplySplitPaymentPreset: (next: PaymentBreakdown) => void;
  onCashReceivedChange: (value: number) => void;
  onIncreaseQty: (id: string) => void;
  onDecreaseQty: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onHoldOrder: () => void;
  onRestoreDraft?: () => void;
  onDiscardDraft?: () => void;
  onClear: () => void;
  onCheckout: () => void;
  disableCheckout?: boolean;
};

export function CartPanel({
  cart,
  stockByProductId = {},
  customers = [],
  selectedCustomerId,
  selectedCustomerLoyaltyPoints,
  selectedCustomerMemberTier,
  selectedCustomerLoyaltyMultiplier,
  estimatedEarnedPoints,
  selectedCustomerOutstandingDebt,
  loyaltyPointValue,
  redeemedPoints,
  loyaltyRedeemAmount,
  maxRedeemablePoints,
  onSelectCustomer,
  onRedeemedPointsChange,
  pendingDraft = null,
  subtotal,
  discountPercent,
  discountAmount,
  total,
  estimatedCost,
  grossProfit,
  grossMarginPercent,
  hasNegativeMargin,
  projectedLossAmount,
  discountApprovalThreshold,
  minimumMarginThreshold,
  isBelowMinimumMarginThreshold,
  isShiftOpen,
  checkoutApprovalHint = "",
  paymentMethod,
  isSplitPayment,
  splitPayment,
  cashReceived,
  changeAmount,
  onDiscountChange,
  onPaymentMethodChange,
  onSplitPaymentToggle,
  onSplitPaymentAmountChange,
  onApplySplitPaymentPreset,
  onCashReceivedChange,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onHoldOrder,
  onRestoreDraft,
  onDiscardDraft,
  onClear,
  onCheckout,
  disableCheckout = false
}: CartPanelProps) {
  const splitTotal = splitPayment.cash + splitPayment.card + splitPayment.qris;
  const splitDifference = total - splitTotal;
  const splitValid = Math.abs(splitDifference) < 1;
  const requiresCashInput = isSplitPayment ? splitPayment.cash > 0 : paymentMethod === "cash";
  const cashTarget = isSplitPayment ? splitPayment.cash : total;
  const roundedCashTarget = Math.max(0, Math.round(cashTarget));
  const quickCashButtons = roundedCashTarget > 0
    ? [
        { key: "exact", label: "Pas", amount: roundedCashTarget },
        { key: "plus5", label: "+5rb", amount: roundedCashTarget + 5_000 },
        { key: "plus10", label: "+10rb", amount: roundedCashTarget + 10_000 },
        { key: "plus20", label: "+20rb", amount: roundedCashTarget + 20_000 }
      ]
    : [];
  const discountPresetValues = Array.from(
    new Set(
      [0, 5, 10, 15, 20, Math.round(discountApprovalThreshold)].filter(
        (value) => value >= 0 && value <= 100
      )
    )
  ).sort((a, b) => a - b);
  const splitHalfPrimary = Math.floor(total / 2);
  const splitHalfSecondary = Math.max(0, total - splitHalfPrimary);
  const selectedCustomerPointsValue = selectedCustomerLoyaltyPoints * loyaltyPointValue;
  const maxRedeemableAmount = maxRedeemablePoints * loyaltyPointValue;
  const loyaltyMultiplierLabel = selectedCustomerLoyaltyMultiplier.toFixed(2).replace(/\.?0+$/, "");
  const nonMemberEstimatedPoints = Math.max(0, Math.floor(total / 10000));

  const applySplitPreset = (next: PaymentBreakdown) => {
    onApplySplitPaymentPreset({
      cash: Math.max(0, Math.round(next.cash)),
      card: Math.max(0, Math.round(next.card)),
      qris: Math.max(0, Math.round(next.qris))
    });
  };
  const draftSavedAtLabel = pendingDraft
    ? new Date(pendingDraft.updatedAt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  return (
    <aside className="max-w-full space-y-4 rounded-3xl bg-surface px-2 py-2 sm:px-3 sm:py-3">
      <div className="rounded-2xl bg-surface-container-low px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-headline text-xl font-extrabold text-on-surface sm:text-2xl">Keranjang Aktif</h2>
            <p className="truncate text-xs text-on-surface-variant sm:text-sm">ID Pesanan: #POS-{new Date().getDate().toString().padStart(2, "0")}{new Date().getHours().toString().padStart(2, "0")}{new Date().getMinutes().toString().padStart(2, "0")}</p>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-on-secondary-container sm:text-xs">
            Sedang Aktif
          </span>
        </div>
      </div>

      {pendingDraft && cart.length === 0 && (
        <div className="grid gap-2 rounded-2xl border border-tertiary/20 bg-tertiary-fixed/35 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-tertiary-fixed-variant">Draft Tersimpan</p>
          <p className="text-sm font-semibold text-on-surface">
            {pendingDraft.itemCount} item • Rp {Math.round(pendingDraft.subtotal).toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-on-surface-variant">Tersimpan otomatis: {draftSavedAtLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestoreDraft}
              className="h-10 rounded-xl bg-primary text-xs font-semibold text-on-primary transition hover:brightness-95 active:scale-[0.98]"
            >
              Pulihkan Draft
            </button>
            <button
              type="button"
              onClick={onDiscardDraft}
              className="h-10 rounded-xl bg-surface-container-high text-xs font-semibold text-on-surface-variant transition hover:brightness-95 active:scale-[0.98]"
            >
              Hapus Draft
            </button>
          </div>
        </div>
      )}

      <ul className="grid gap-3">
        {cart.length === 0 && (
          <li className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-surface-container-low/50">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-surface-container-high/50 text-outline-variant mb-4">
              <span className="material-symbols-outlined text-[40px] opacity-50">shopping_basket</span>
            </div>
            <h3 className="font-headline text-base font-bold text-on-surface mb-1">Keranjang kosong</h3>
            <p className="text-xs text-on-surface-variant max-w-[200px]">
              Pilih produk dari katalog untuk mulai menambahkan ke pesanan.
            </p>
          </li>
        )}
        {cart.map((item) => {
          const availableStock = Math.max(0, stockByProductId[item.id] ?? 0);
          const canIncrease = availableStock > item.qty;

          return (
            <li key={item.id} className="rounded-2xl bg-surface-container-low px-4 py-3">
            <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="block truncate font-headline text-base font-semibold text-on-surface">{item.name}</span>
              <span className="mt-0.5 block text-xs text-on-surface-variant">SKU: {item.id}</span>
              <span className="mt-0.5 block text-xs text-on-surface-variant">Stok tersedia: {availableStock}</span>
              <span className="mt-1 block font-headline text-lg font-bold text-primary">Rp {item.price.toLocaleString("id-ID")}</span>
            </div>

              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-container-high text-on-surface-variant active:scale-95"
                onClick={() => onRemoveItem(item.id)}
                aria-label={`Hapus ${item.name}`}
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-end gap-3 rounded-xl bg-surface-container-lowest p-1">
              <button
                type="button"
                onClick={() => onDecreaseQty(item.id)}
                className="grid h-10 w-10 place-items-center rounded-lg bg-surface-container-low text-primary active:scale-95 transition-transform"
                aria-label={`Kurangi ${item.name}`}
              >
                <span className="material-symbols-outlined text-[20px]">remove</span>
              </button>
              <span className="min-w-6 text-center text-sm font-bold text-on-surface">{item.qty}</span>
              <button
                type="button"
                onClick={() => onIncreaseQty(item.id)}
                disabled={!canIncrease}
                className={
                  canIncrease
                    ? "grid h-10 w-10 place-items-center rounded-lg bg-surface-container-low text-primary active:scale-95 transition-transform"
                    : "grid h-10 w-10 place-items-center rounded-lg bg-surface-container-high text-outline-variant"
                }
                aria-label={`Tambah ${item.name}`}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>

            {!canIncrease && (
              <p className="mt-2 text-right text-[11px] font-semibold text-error">
                Batas stok tercapai
              </p>
            )}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-3 rounded-2xl bg-surface-container-low p-4">
        <label htmlFor="customer" className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Pelanggan (Loyalty)</label>
          <div className="relative">
            <select
              id="customer"
              value={selectedCustomerId || ""}
              onChange={(e) => onSelectCustomer?.(e.target.value || undefined)}
              className="h-12 w-full appearance-none rounded-xl border-none bg-surface-container-lowest px-3 pr-10 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            >
              <option value="">-- Non Member --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.loyalty_points ? `(Pts: ${c.loyalty_points})` : ""}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">
              expand_more
            </span>
          </div>

          {selectedCustomerId ? (
            <div className="grid gap-2">
              <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
                Poin tersedia: <span className="font-semibold text-on-surface">{selectedCustomerLoyaltyPoints.toLocaleString("id-ID")}</span>
                {" "}(setara Rp {Math.round(selectedCustomerPointsValue).toLocaleString("id-ID")}) • Maks ditukar saat ini {maxRedeemablePoints.toLocaleString("id-ID")} poin
                {" "}(Rp {Math.round(maxRedeemableAmount).toLocaleString("id-ID")})
              </p>
              <p className="rounded-xl bg-secondary-container/45 px-3 py-2 text-xs text-on-secondary-container">
                Tier member: <span className="font-semibold">{selectedCustomerMemberTier || "Silver"}</span>
                {" "}• Multiplier poin x{loyaltyMultiplierLabel}
                {" "}• Estimasi poin transaksi ini <span className="font-semibold">+{estimatedEarnedPoints.toLocaleString("id-ID")}</span>
              </p>
              {selectedCustomerOutstandingDebt > 0 && (
                <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
                  Pelanggan punya piutang aktif Rp {Math.round(selectedCustomerOutstandingDebt).toLocaleString("id-ID")}. Pastikan status pembayaran terkonfirmasi.
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
              {nonMemberEstimatedPoints > 0
                ? `Pilih member untuk menukar poin loyalty dan dapat estimasi +${nonMemberEstimatedPoints.toLocaleString("id-ID")} poin.`
                : "Pilih member untuk menukar poin loyalty."}
            </p>
          )}

          <label htmlFor="redeemed-points" className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Tukar Poin</label>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              id="redeemed-points"
              type="number"
              min={0}
              max={maxRedeemablePoints}
              value={redeemedPoints}
              disabled={!selectedCustomerId || maxRedeemablePoints <= 0}
              className="h-12 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              onChange={(event) => onRedeemedPointsChange(Number(event.target.value || 0))}
            />
            <button
              type="button"
              onClick={() => onRedeemedPointsChange(maxRedeemablePoints)}
              disabled={!selectedCustomerId || maxRedeemablePoints <= 0}
              className="h-12 rounded-xl bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface-variant transition hover:brightness-95 disabled:opacity-60"
            >
              Pakai Maks
            </button>
          </div>
          {loyaltyRedeemAmount > 0 && (
            <p className="text-xs text-secondary">
              Potongan loyalty aktif: - Rp {Math.round(loyaltyRedeemAmount).toLocaleString("id-ID")}
            </p>
          )}

          <label htmlFor="discount" className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Diskon (%)</label>
        <input
          id="discount"
          type="number"
          min={0}
          max={100}
          value={discountPercent}
          className="h-12 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
          onChange={(event) => onDiscountChange(Number(event.target.value || 0))}
        />

        <div className="grid gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Preset Diskon Cepat</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {discountPresetValues.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onDiscountChange(value)}
                className={
                  discountPercent === value
                    ? "h-8 rounded-lg bg-primary text-[11px] font-bold text-on-primary"
                    : "h-8 rounded-lg bg-surface-container-lowest text-[11px] font-semibold text-on-surface-variant"
                }
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {discountPercent > discountApprovalThreshold && (
          <p className="rounded-xl bg-tertiary-fixed/50 px-3 py-2 text-xs font-semibold text-on-tertiary-fixed-variant">
            Diskon di atas {discountApprovalThreshold}% memerlukan approval manager/owner saat checkout.
          </p>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Metode Bayar</p>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Split Payment</span>
            <button
              type="button"
              onClick={() => onSplitPaymentToggle(!isSplitPayment)}
              className={
                isSplitPayment
                  ? "h-8 rounded-lg bg-primary px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-on-primary"
                  : "h-8 rounded-lg bg-surface-container-high px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
              }
            >
              {isSplitPayment ? "Aktif" : "Nonaktif"}
            </button>
          </div>

          {!isSplitPayment && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onPaymentMethodChange("cash")}
                className={paymentMethod === "cash" ? "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-primary text-on-primary tap-bounce" : "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-lowest text-on-surface-variant tap-bounce"}
              >
                <span className="material-symbols-outlined text-[22px]">payments</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => onPaymentMethodChange("qris")}
                className={paymentMethod === "qris" ? "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-primary text-on-primary tap-bounce" : "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-lowest text-on-surface-variant tap-bounce"}
              >
                <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">QRIS</span>
              </button>
              <button
                type="button"
                onClick={() => onPaymentMethodChange("card")}
                className={paymentMethod === "card" ? "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-primary text-on-primary tap-bounce" : "flex h-16 flex-col items-center justify-center gap-1 rounded-xl bg-surface-container-lowest text-on-surface-variant tap-bounce"}
              >
                <span className="material-symbols-outlined text-[22px]">credit_card</span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Kartu</span>
              </button>
            </div>
          )}

          {isSplitPayment && (
            <div className="mt-2 grid gap-2">
              <div className="grid grid-cols-3 gap-2">
                <label className="rounded-xl bg-surface-container-lowest px-2 py-2 text-xs text-on-surface-variant">
                  Tunai
                  <input
                    type="number"
                    min={0}
                    value={splitPayment.cash}
                    onChange={(event) => onSplitPaymentAmountChange("cash", Number(event.target.value || 0))}
                    className="mt-1 h-9 w-full rounded-lg border-none bg-surface-container-low px-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="rounded-xl bg-surface-container-lowest px-2 py-2 text-xs text-on-surface-variant">
                  Kartu
                  <input
                    type="number"
                    min={0}
                    value={splitPayment.card}
                    onChange={(event) => onSplitPaymentAmountChange("card", Number(event.target.value || 0))}
                    className="mt-1 h-9 w-full rounded-lg border-none bg-surface-container-low px-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="rounded-xl bg-surface-container-lowest px-2 py-2 text-xs text-on-surface-variant">
                  QRIS
                  <input
                    type="number"
                    min={0}
                    value={splitPayment.qris}
                    onChange={(event) => onSplitPaymentAmountChange("qris", Number(event.target.value || 0))}
                    className="mt-1 h-9 w-full rounded-lg border-none bg-surface-container-low px-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                  />
                </label>
              </div>

              {total > 0 && (
                <div className="grid gap-1.5 rounded-xl bg-surface-container-lowest px-2 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                    Preset Split Cepat
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => applySplitPreset({ cash: total, card: 0, qris: 0 })}
                      className="h-8 rounded-lg bg-surface-container-low text-[11px] font-semibold text-on-surface-variant"
                    >
                      Tunai 100%
                    </button>
                    <button
                      type="button"
                      onClick={() => applySplitPreset({ cash: 0, card: total, qris: 0 })}
                      className="h-8 rounded-lg bg-surface-container-low text-[11px] font-semibold text-on-surface-variant"
                    >
                      Kartu 100%
                    </button>
                    <button
                      type="button"
                      onClick={() => applySplitPreset({ cash: 0, card: 0, qris: total })}
                      className="h-8 rounded-lg bg-surface-container-low text-[11px] font-semibold text-on-surface-variant"
                    >
                      QRIS 100%
                    </button>
                    <button
                      type="button"
                      onClick={() => applySplitPreset({ cash: splitHalfPrimary, card: splitHalfSecondary, qris: 0 })}
                      className="h-8 rounded-lg bg-surface-container-low text-[11px] font-semibold text-on-surface-variant"
                    >
                      50:50 Cash+Card
                    </button>
                    <button
                      type="button"
                      onClick={() => applySplitPreset({ cash: splitHalfPrimary, card: 0, qris: splitHalfSecondary })}
                      className="h-8 rounded-lg bg-surface-container-low text-[11px] font-semibold text-on-surface-variant"
                    >
                      50:50 Cash+QRIS
                    </button>
                    <button
                      type="button"
                      onClick={() => applySplitPreset({ cash: 0, card: 0, qris: 0 })}
                      className="h-8 rounded-lg bg-surface-container-low text-[11px] font-semibold text-on-surface-variant"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
              )}

              <p className={splitValid ? "text-xs text-on-surface-variant" : "text-xs font-semibold text-error"}>
                Split: Rp {splitTotal.toLocaleString("id-ID")} / Total: Rp {total.toLocaleString("id-ID")}
                {!splitValid && ` (selisih Rp ${Math.abs(splitDifference).toLocaleString("id-ID")})`}
              </p>
            </div>
          )}
        </div>
      </div>

      {requiresCashInput && (
        <div className="grid gap-1.5 rounded-2xl bg-surface-container-low p-4">
          <label htmlFor="cash-received" className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Uang Diterima</label>
          <input
            id="cash-received"
            type="number"
            min={0}
            value={cashReceived}
            className="h-12 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            onChange={(event) => onCashReceivedChange(Number(event.target.value || 0))}
          />
          <p className="text-sm text-on-surface-variant">
            {isSplitPayment ? "Target Tunai" : "Tagihan Tunai"}: <span className="font-semibold text-on-surface">Rp {cashTarget.toLocaleString("id-ID")}</span>
          </p>
          <p className="text-sm text-on-surface-variant">
            Kembalian: <span className="font-headline text-xl font-bold text-on-surface">Rp {changeAmount.toLocaleString("id-ID")}</span>
          </p>
          {quickCashButtons.length > 0 && (
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {quickCashButtons.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onCashReceivedChange(option.amount)}
                  className={
                    cashReceived === option.amount
                      ? "h-9 rounded-lg bg-primary text-[11px] font-bold text-on-primary"
                      : "h-9 rounded-lg bg-surface-container-lowest text-[11px] font-semibold text-on-surface-variant"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-2 rounded-3xl bg-surface-container-low p-5 text-sm">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Subtotal</span>
          <span className="font-headline text-base font-semibold sm:text-lg">Rp {subtotal.toLocaleString("id-ID")}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Potongan Diskon {discountPercent > 0 ? `(${discountPercent}%)` : ""}</span>
            <span className="font-headline text-base font-semibold text-error sm:text-lg">- Rp {discountAmount.toLocaleString("id-ID")}</span>
          </div>
        )}
        {loyaltyRedeemAmount > 0 && (
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Potongan Loyalty ({redeemedPoints.toLocaleString("id-ID")} poin)</span>
            <span className="font-headline text-base font-semibold text-secondary sm:text-lg">- Rp {Math.round(loyaltyRedeemAmount).toLocaleString("id-ID")}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3 text-on-surface">
          <strong className="font-headline text-lg sm:text-xl">Total Akhir</strong>
          <strong className="font-headline text-2xl font-extrabold text-primary sm:text-3xl">Rp {total.toLocaleString("id-ID")}</strong>
        </div>
        {isSplitPayment && (
          <p className={`text-xs mt-1 font-medium ${splitValid ? "text-on-surface-variant" : "text-error"}`}>
            {splitValid 
              ? "✓ Pembayaran split sudah sesuai tagihan" 
              : `⚠ Total pembayaran selisih Rp ${Math.abs(splitDifference).toLocaleString("id-ID")}`}
          </p>
        )}
      </div>

      <div className="grid gap-2 rounded-2xl bg-surface-container-low p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Analisis Profit Transaksi</p>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Estimasi HPP</span>
          <span className="font-headline text-base font-semibold text-on-surface">Rp {Math.round(estimatedCost).toLocaleString("id-ID")}</span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Laba Kotor</span>
          <span className={`font-headline text-base font-semibold ${grossProfit < 0 ? "text-error" : "text-secondary"}`}>
            {grossProfit < 0 ? "-" : "+"}Rp {Math.abs(Math.round(grossProfit)).toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span>Margin Kotor</span>
          <span className={`font-headline text-base font-semibold ${hasNegativeMargin || isBelowMinimumMarginThreshold ? "text-error" : "text-on-surface"}`}>
            {grossMarginPercent === null ? "-" : `${grossMarginPercent.toFixed(1)}%`}
          </span>
        </div>

        {!hasNegativeMargin && isBelowMinimumMarginThreshold && grossMarginPercent !== null && (
          <p className="mt-1 rounded-xl bg-tertiary-fixed/50 px-3 py-2 text-xs font-semibold text-on-tertiary-fixed-variant">
            Margin {grossMarginPercent.toFixed(1)}% berada di bawah batas minimum {minimumMarginThreshold}% dan akan memerlukan approval manager/owner saat checkout.
          </p>
        )}

        {hasNegativeMargin && (
          <p className="mt-1 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
            Margin negatif terdeteksi. Estimasi rugi Rp {Math.round(projectedLossAmount).toLocaleString("id-ID")}. Approval manager/owner diperlukan saat checkout.
          </p>
        )}
      </div>

      <div className="sticky bottom-2 grid gap-2 rounded-2xl bg-surface-container-low px-3 py-3 backdrop-blur sm:static sm:bg-transparent sm:px-0 sm:py-0">
        {!isShiftOpen && (
          <p className="rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
            Shift belum dibuka. Buka shift di tab Home sebelum checkout.
          </p>
        )}

        {checkoutApprovalHint.trim().length > 0 && (
          <p className="rounded-xl bg-tertiary-fixed/50 px-3 py-2 text-xs font-semibold text-on-tertiary-fixed-variant">
            {checkoutApprovalHint}
          </p>
        )}

        <button
          className="h-11 w-full rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant transition hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
          onClick={onHoldOrder}
          disabled={cart.length === 0}
        >
          Tahan Order
        </button>
        <button
          className="h-11 w-full rounded-xl bg-error-container text-sm font-semibold text-on-error-container transition hover:brightness-95 active:scale-[0.98]"
          onClick={onClear}
        >
          Reset
        </button>
        <button
          className="h-14 w-full rounded-2xl bg-gradient-to-br from-primary to-primary-container text-base font-bold text-on-primary shadow-lg shadow-teal-900/10 transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          onClick={onCheckout}
          disabled={cart.length === 0 || disableCheckout || !isShiftOpen || (isSplitPayment && !splitValid)}
        >
          Konfirmasi Bayar
        </button>
      </div>
    </aside>
  );
}
