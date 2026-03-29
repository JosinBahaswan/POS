export type CashMovementType = "in" | "out";

export type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: number;
  note: string;
  createdAt: string;
};

export type ShiftSession = {
  id: string;
  openedAt: string;
  openingCash: number;
  openedById?: string;
  openedByName?: string;
  outletId?: string;
  closedAt?: string;
  closingCash?: number;
  closingNote?: string;
  closedByName?: string;
  movements: CashMovement[];
};

const SHIFT_SESSIONS_KEY = "pos_shift_sessions";

function scopedKey(baseKey: string, scopeKey: string) {
  return `${baseKey}:${scopeKey}`;
}

function readRawShiftSessions(scopeKey = "default"): ShiftSession[] {
  const raw = localStorage.getItem(scopedKey(SHIFT_SESSIONS_KEY, scopeKey));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ShiftSession[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((session) => ({
      ...session,
      openingCash: Number(session.openingCash || 0),
      openedById: session.openedById,
      openedByName: session.openedByName,
      outletId: session.outletId || "MAIN",
      closingCash: session.closingCash === undefined ? undefined : Number(session.closingCash),
      closedByName: session.closedByName,
      movements: Array.isArray(session.movements)
        ? session.movements.map((movement) => ({
            ...movement,
            amount: Number(movement.amount || 0),
            type: movement.type === "out" ? "out" : "in"
          }))
        : []
    }));
  } catch {
    return [];
  }
}

function writeShiftSessions(sessions: ShiftSession[], scopeKey = "default") {
  localStorage.setItem(scopedKey(SHIFT_SESSIONS_KEY, scopeKey), JSON.stringify(sessions));
}

export function readShiftSessions(scopeKey = "default"): ShiftSession[] {
  return readRawShiftSessions(scopeKey).sort((a, b) =>
    new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );
}

export function getActiveShift(scopeKey = "default"): ShiftSession | null {
  const sessions = readRawShiftSessions(scopeKey);
  return sessions.find((session) => !session.closedAt) ?? null;
}

export function openShift(
  openingCash: number,
  scopeKey = "default",
  meta?: { openedById?: string; openedByName?: string; outletId?: string }
): ShiftSession {
  const normalizedOpeningCash = Math.max(0, Number(openingCash || 0));
  const sessions = readRawShiftSessions(scopeKey);

  if (sessions.some((session) => !session.closedAt)) {
    throw new Error("Masih ada shift aktif. Tutup shift sebelumnya dulu.");
  }

  const nextSession: ShiftSession = {
    id: `SHIFT-${Date.now()}`,
    openedAt: new Date().toISOString(),
    openingCash: normalizedOpeningCash,
    openedById: meta?.openedById,
    openedByName: meta?.openedByName,
    outletId: meta?.outletId || "MAIN",
    movements: []
  };

  writeShiftSessions([nextSession, ...sessions], scopeKey);
  return nextSession;
}

export function addCashMovement(
  type: CashMovementType,
  amount: number,
  note: string,
  scopeKey = "default"
): ShiftSession {
  const normalizedAmount = Math.max(0, Number(amount || 0));
  if (normalizedAmount <= 0) {
    throw new Error("Nominal kas harus lebih dari 0.");
  }

  const sessions = readRawShiftSessions(scopeKey);
  const activeIndex = sessions.findIndex((session) => !session.closedAt);
  if (activeIndex < 0) {
    throw new Error("Belum ada shift aktif.");
  }

  const movement: CashMovement = {
    id: `CM-${Date.now()}`,
    type,
    amount: normalizedAmount,
    note: note.trim(),
    createdAt: new Date().toISOString()
  };

  const current = sessions[activeIndex];
  const updated: ShiftSession = {
    ...current,
    movements: [movement, ...current.movements]
  };

  sessions[activeIndex] = updated;
  writeShiftSessions(sessions, scopeKey);
  return updated;
}

export function closeShift(
  closingCash: number,
  closingNote: string,
  scopeKey = "default",
  closedByName?: string
): ShiftSession {
  const normalizedClosingCash = Math.max(0, Number(closingCash || 0));
  const sessions = readRawShiftSessions(scopeKey);
  const activeIndex = sessions.findIndex((session) => !session.closedAt);
  if (activeIndex < 0) {
    throw new Error("Belum ada shift aktif untuk ditutup.");
  }

  const current = sessions[activeIndex];
  const updated: ShiftSession = {
    ...current,
    closedAt: new Date().toISOString(),
    closingCash: normalizedClosingCash,
    closingNote: closingNote.trim(),
    closedByName: closedByName?.trim() || current.closedByName
  };

  sessions[activeIndex] = updated;
  writeShiftSessions(sessions, scopeKey);
  return updated;
}