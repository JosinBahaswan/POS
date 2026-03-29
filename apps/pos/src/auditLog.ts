import type { UserRole } from "./types";

export type AuditLogEntry = {
  id: string;
  createdAt: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
};

type AppendAuditInput = {
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: string;
};

const AUDIT_LOG_KEY = "pos_audit_log";
const MAX_AUDIT_LOGS = 500;

function scopedKey(baseKey: string, scopeKey: string) {
  return `${baseKey}:${scopeKey}`;
}

function normalizeAuditLog(raw: Partial<AuditLogEntry>): AuditLogEntry | null {
  if (!raw.id || !raw.createdAt || !raw.actorName || !raw.actorRole || !raw.action || !raw.targetType) {
    return null;
  }

  if (raw.actorRole !== "cashier" && raw.actorRole !== "manager" && raw.actorRole !== "owner") {
    return null;
  }

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    actorName: raw.actorName,
    actorRole: raw.actorRole,
    action: raw.action,
    targetType: raw.targetType,
    targetId: raw.targetId,
    detail: raw.detail
  };
}

export function readAuditLogs(scopeKey = "default"): AuditLogEntry[] {
  const raw = localStorage.getItem(scopedKey(AUDIT_LOG_KEY, scopeKey));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Partial<AuditLogEntry>>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeAuditLog)
      .filter((entry): entry is AuditLogEntry => Boolean(entry))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function writeAuditLogs(entries: AuditLogEntry[], scopeKey = "default") {
  localStorage.setItem(scopedKey(AUDIT_LOG_KEY, scopeKey), JSON.stringify(entries));
}

export function appendAuditLog(input: AppendAuditInput, scopeKey = "default"): AuditLogEntry {
  const next: AuditLogEntry = {
    id: `AUD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    actorName: input.actorName.trim() || "Unknown",
    actorRole: input.actorRole,
    action: input.action.trim(),
    targetType: input.targetType.trim(),
    targetId: input.targetId?.trim() || undefined,
    detail: input.detail?.trim() || undefined
  };

  const current = readAuditLogs(scopeKey);
  const merged = [next, ...current].slice(0, MAX_AUDIT_LOGS);
  writeAuditLogs(merged, scopeKey);
  return next;
}
