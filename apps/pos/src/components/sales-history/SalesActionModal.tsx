import type { ActiveSalesAction } from "./types";

type SalesActionModalProps = {
  activeAction: ActiveSalesAction;
  actionReason: string;
  actionError: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function SalesActionModal({
  activeAction,
  actionReason,
  actionError,
  onReasonChange,
  onClose,
  onSubmit
}: SalesActionModalProps) {
  if (!activeAction) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/35 px-3 pb-4 pt-20 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md rounded-2xl bg-surface-container-low p-4 editorial-shadow sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-headline text-xl font-extrabold text-on-surface">
              {activeAction.mode === "refund" ? "Ajukan Refund" : "Ajukan Void"}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">{activeAction.saleId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-surface-container-high text-on-surface-variant"
            aria-label="Tutup dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="mt-3 grid gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            Alasan {activeAction.mode === "refund" ? "refund" : "void"}
          </label>
          <textarea
            rows={3}
            value={actionReason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="rounded-xl border-none bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            placeholder="Tuliskan alasan permintaan"
          />
        </div>

        {actionError && (
          <p className="mt-2 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
            {actionError}
          </p>
        )}

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
            onClick={onSubmit}
            className={
              activeAction.mode === "refund"
                ? "h-10 rounded-xl bg-tertiary-fixed text-sm font-semibold text-on-tertiary-fixed-variant"
                : "h-10 rounded-xl bg-error-container text-sm font-semibold text-on-error-container"
            }
          >
            Kirim Permintaan
          </button>
        </div>
      </aside>
    </div>
  );
}
