export type InfoDialogState = {
  title: string;
  message: string;
  tone: "info" | "error";
};

type ProductInfoModalProps = {
  dialog: InfoDialogState | null;
  onClose: () => void;
};

export function ProductInfoModal({ dialog, onClose }: ProductInfoModalProps) {
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
