import { useMemo, useState } from "react";
import type { CashMovementType, ShiftSession } from "../shift";

type CashierShiftPanelProps = {
  activeShift: ShiftSession | null;
  recentShifts: ShiftSession[];
  onOpenShift: (openingCash: number) => void;
  onCloseShift: (closingCash: number, note: string) => void;
  onAddCashMovement: (type: CashMovementType, amount: number, note: string) => void;
};

export function CashierShiftPanel({
  activeShift,
  recentShifts,
  onOpenShift,
  onCloseShift,
  onAddCashMovement
}: CashierShiftPanelProps) {
  const [openingCashInput, setOpeningCashInput] = useState<number>(0);
  const [movementType, setMovementType] = useState<CashMovementType>("out");
  const [movementAmount, setMovementAmount] = useState<number>(0);
  const [movementNote, setMovementNote] = useState("");
  const [closingCash, setClosingCash] = useState<number>(0);
  const [closingNote, setClosingNote] = useState("");
  const [formError, setFormError] = useState("");

  const summary = useMemo(() => {
    if (!activeShift) {
      return { cashIn: 0, cashOut: 0, net: 0 };
    }

    const cashIn = activeShift.movements
      .filter((movement) => movement.type === "in")
      .reduce((acc, movement) => acc + movement.amount, 0);
    const cashOut = activeShift.movements
      .filter((movement) => movement.type === "out")
      .reduce((acc, movement) => acc + movement.amount, 0);

    return {
      cashIn,
      cashOut,
      net: cashIn - cashOut
    };
  }, [activeShift]);

  const submitOpenShift = () => {
    setFormError("");
    try {
      onOpenShift(openingCashInput);
      setOpeningCashInput(0);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal membuka shift.");
    }
  };

  const submitMovement = () => {
    setFormError("");
    try {
      onAddCashMovement(movementType, movementAmount, movementNote);
      setMovementAmount(0);
      setMovementNote("");
      setMovementType("out");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menyimpan kas masuk/keluar.");
    }
  };

  const submitCloseShift = () => {
    setFormError("");
    try {
      onCloseShift(closingCash, closingNote);
      setClosingCash(0);
      setClosingNote("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Gagal menutup shift.");
    }
  };

  return (
    <section className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Kasir Control</p>
      <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl">Shift dan Kas Kecil</h2>

      {formError && (
        <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
          {formError}
        </p>
      )}

      {!activeShift && (
        <div className="mt-4 rounded-2xl bg-surface-container-lowest p-4">
          <p className="text-sm font-semibold text-on-surface">Belum ada shift aktif</p>
          <p className="mt-1 text-xs text-on-surface-variant">Masukkan saldo awal kas untuk membuka shift.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min={0}
              value={openingCashInput}
              onChange={(event) => setOpeningCashInput(Number(event.target.value || 0))}
              className="h-11 flex-1 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
              placeholder="Saldo awal"
            />
            <button
              type="button"
              onClick={submitOpenShift}
              className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
            >
              Buka Shift
            </button>
          </div>
        </div>
      )}

      {activeShift && (
        <div className="mt-4 grid gap-3">
          <article className="rounded-2xl bg-surface-container-lowest p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Shift Aktif</p>
                <p className="font-headline text-lg font-bold text-on-surface">{activeShift.id}</p>
              </div>
              <span className="rounded-full bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-secondary-container">
                Aktif
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <p className="rounded-xl bg-surface-container-low px-3 py-2 text-on-surface-variant">
                Saldo Awal: <span className="font-semibold text-on-surface">Rp {activeShift.openingCash.toLocaleString("id-ID")}</span>
              </p>
              <p className="rounded-xl bg-surface-container-low px-3 py-2 text-on-surface-variant">
                Kas Masuk: <span className="font-semibold text-on-surface">Rp {summary.cashIn.toLocaleString("id-ID")}</span>
              </p>
              <p className="rounded-xl bg-surface-container-low px-3 py-2 text-on-surface-variant">
                Kas Keluar: <span className="font-semibold text-on-surface">Rp {summary.cashOut.toLocaleString("id-ID")}</span>
              </p>
            </div>

            <p className="mt-2 text-sm text-on-surface-variant">
              Net Kas Kecil: <span className="font-semibold text-on-surface">Rp {summary.net.toLocaleString("id-ID")}</span>
            </p>
          </article>

          <article className="rounded-2xl bg-surface-container-lowest p-4">
            <p className="text-sm font-semibold text-on-surface">Kas Masuk/Keluar Kecil</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <select
                value={movementType}
                onChange={(event) => setMovementType(event.target.value as CashMovementType)}
                className="h-11 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
              >
                <option value="out">Kas Keluar</option>
                <option value="in">Kas Masuk</option>
              </select>
              <input
                type="number"
                min={0}
                value={movementAmount}
                onChange={(event) => setMovementAmount(Number(event.target.value || 0))}
                className="h-11 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Nominal"
              />
              <input
                type="text"
                value={movementNote}
                onChange={(event) => setMovementNote(event.target.value)}
                className="h-11 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Catatan"
              />
              <button
                type="button"
                onClick={submitMovement}
                className="h-11 rounded-xl bg-surface-container-high px-4 text-sm font-semibold text-on-surface"
              >
                Simpan
              </button>
            </div>
          </article>

          <article className="rounded-2xl bg-surface-container-lowest p-4">
            <p className="text-sm font-semibold text-on-surface">Tutup Shift</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                type="number"
                min={0}
                value={closingCash}
                onChange={(event) => setClosingCash(Number(event.target.value || 0))}
                className="h-11 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Saldo akhir kas"
              />
              <input
                type="text"
                value={closingNote}
                onChange={(event) => setClosingNote(event.target.value)}
                className="h-11 rounded-xl border-none bg-surface-container-low px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                placeholder="Catatan penutupan"
              />
              <button
                type="button"
                onClick={submitCloseShift}
                className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
              >
                Tutup Shift
              </button>
            </div>
          </article>
        </div>
      )}

      {recentShifts.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {recentShifts.slice(0, 3).map((session) => (
            <li key={session.id} className="rounded-xl bg-surface-container-lowest px-3 py-2 text-xs text-on-surface-variant">
              <p className="font-semibold text-on-surface">{session.id}</p>
              <p>
                {new Date(session.openedAt).toLocaleString("id-ID")} - {session.closedAt ? new Date(session.closedAt).toLocaleString("id-ID") : "aktif"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}