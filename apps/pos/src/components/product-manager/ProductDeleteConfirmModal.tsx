export type DeleteDialogState = {
  ids: string[];
  title: string;
  message: string;
  confirmLabel: string;
};

type ProductDeleteConfirmModalProps = {
  dialog: DeleteDialogState | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function ProductDeleteConfirmModal({
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
