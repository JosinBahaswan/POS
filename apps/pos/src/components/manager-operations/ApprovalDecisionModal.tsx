import type { ActiveApprovalDecision } from "./types";
import { approvalLabel } from "./utils";

type ApprovalDecisionModalProps = {
  activeDecision: ActiveApprovalDecision;
  processingId: string;
  decisionNote: string;
  decisionError: string;
  onDecisionNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function ApprovalDecisionModal({
  activeDecision,
  processingId,
  decisionNote,
  decisionError,
  onDecisionNoteChange,
  onClose,
  onSubmit
}: ApprovalDecisionModalProps) {
  if (!activeDecision) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 px-3 pb-4 pt-20 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md rounded-2xl bg-surface-container-low p-4 editorial-shadow sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-headline text-xl font-extrabold text-on-surface">
              {activeDecision.decision === "approved" ? "Konfirmasi Approval" : "Konfirmasi Penolakan"}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              {activeDecision.request.id} • {approvalLabel(activeDecision.request.type)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-surface-container-high text-on-surface-variant"
            aria-label="Tutup dialog approval"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="mt-3 grid gap-1">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            {activeDecision.decision === "approved" ? "Catatan (opsional)" : "Alasan penolakan"}
          </label>
          <textarea
            rows={3}
            value={decisionNote}
            onChange={(event) => onDecisionNoteChange(event.target.value)}
            className="rounded-xl border-none bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            placeholder={
              activeDecision.decision === "approved"
                ? "Contoh: validasi nominal sudah sesuai"
                : "Tulis alasan penolakan"
            }
          />
        </div>

        {decisionError && (
          <p className="mt-2 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
            {decisionError}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(processingId)}
            className="h-10 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={Boolean(processingId)}
            className={
              activeDecision.decision === "approved"
                ? "h-10 rounded-xl bg-secondary-container text-sm font-semibold text-on-secondary-container disabled:opacity-60"
                : "h-10 rounded-xl bg-error-container text-sm font-semibold text-on-error-container disabled:opacity-60"
            }
          >
            {processingId === activeDecision.request.id
              ? "Memproses..."
              : activeDecision.decision === "approved"
                ? "Setujui"
                : "Tolak"}
          </button>
        </div>
      </aside>
    </div>
  );
}
