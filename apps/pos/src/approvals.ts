import type { UserRole } from "./types";

export type ApprovalRequestType = "large-discount" | "refund" | "void";

export type ApprovalRequestStatus = "pending" | "approved" | "rejected";

export type ApprovalDecision = Exclude<ApprovalRequestStatus, "pending">;

export type ApprovalRules = {
  largeDiscountPercentThreshold: number;
  requireRefundApproval: boolean;
  requireVoidApproval: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type ApprovalRequest = {
  id: string;
  type: ApprovalRequestType;
  status: ApprovalRequestStatus;
  requestedBy: string;
  requestedRole: UserRole;
  reason: string;
  saleId?: string;
  contextHash?: string;
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  total?: number;
  itemCount?: number;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
};

type CreateApprovalInput = {
  type: ApprovalRequestType;
  requestedBy: string;
  requestedRole: UserRole;
  reason: string;
  saleId?: string;
  contextHash?: string;
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  total?: number;
  itemCount?: number;
};

const APPROVAL_RULES_KEY = "pos_approval_rules";
const APPROVAL_REQUESTS_KEY = "pos_approval_requests";

function scopedKey(baseKey: string, scopeKey: string) {
  return `${baseKey}:${scopeKey}`;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function defaultRules(): ApprovalRules {
  return {
    largeDiscountPercentThreshold: 15,
    requireRefundApproval: true,
    requireVoidApproval: true,
    updatedAt: new Date().toISOString(),
    updatedBy: "system"
  };
}

export function readApprovalRules(scopeKey = "default"): ApprovalRules {
  const raw = localStorage.getItem(scopedKey(APPROVAL_RULES_KEY, scopeKey));
  if (!raw) return defaultRules();

  try {
    const parsed = JSON.parse(raw) as Partial<ApprovalRules>;
    const baseline = defaultRules();

    return {
      largeDiscountPercentThreshold: Math.min(
        100,
        Math.max(0, Math.round(normalizeNumber(parsed.largeDiscountPercentThreshold, baseline.largeDiscountPercentThreshold)))
      ),
      requireRefundApproval: normalizeBoolean(parsed.requireRefundApproval, baseline.requireRefundApproval),
      requireVoidApproval: normalizeBoolean(parsed.requireVoidApproval, baseline.requireVoidApproval),
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim().length > 0
          ? parsed.updatedAt
          : baseline.updatedAt,
      updatedBy:
        typeof parsed.updatedBy === "string" && parsed.updatedBy.trim().length > 0
          ? parsed.updatedBy
          : baseline.updatedBy
    };
  } catch {
    return defaultRules();
  }
}

export function saveApprovalRules(
  input: Pick<ApprovalRules, "largeDiscountPercentThreshold" | "requireRefundApproval" | "requireVoidApproval">,
  updatedBy: string,
  scopeKey = "default"
): ApprovalRules {
  const next: ApprovalRules = {
    largeDiscountPercentThreshold: Math.min(100, Math.max(0, Math.round(input.largeDiscountPercentThreshold))),
    requireRefundApproval: Boolean(input.requireRefundApproval),
    requireVoidApproval: Boolean(input.requireVoidApproval),
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy.trim() || "unknown"
  };

  localStorage.setItem(scopedKey(APPROVAL_RULES_KEY, scopeKey), JSON.stringify(next));
  return next;
}

function normalizeRequest(raw: Partial<ApprovalRequest>): ApprovalRequest | null {
  const status: ApprovalRequestStatus =
    raw.status === "approved" || raw.status === "rejected" ? raw.status : "pending";

  if (!raw.id || !raw.type || !raw.requestedBy || !raw.requestedRole || !raw.createdAt) {
    return null;
  }

  if (raw.type !== "large-discount" && raw.type !== "refund" && raw.type !== "void") {
    return null;
  }

  return {
    id: raw.id,
    type: raw.type,
    status,
    requestedBy: raw.requestedBy,
    requestedRole: raw.requestedRole,
    reason: raw.reason ?? "",
    saleId: raw.saleId,
    contextHash: raw.contextHash,
    subtotal: raw.subtotal === undefined ? undefined : normalizeNumber(raw.subtotal, 0),
    discountPercent: raw.discountPercent === undefined ? undefined : normalizeNumber(raw.discountPercent, 0),
    discountAmount: raw.discountAmount === undefined ? undefined : normalizeNumber(raw.discountAmount, 0),
    total: raw.total === undefined ? undefined : normalizeNumber(raw.total, 0),
    itemCount: raw.itemCount === undefined ? undefined : Math.max(0, Math.round(normalizeNumber(raw.itemCount, 0))),
    createdAt: raw.createdAt,
    resolvedAt: raw.resolvedAt,
    resolvedBy: raw.resolvedBy,
    resolutionNote: raw.resolutionNote
  };
}

export function readApprovalRequests(scopeKey = "default"): ApprovalRequest[] {
  const raw = localStorage.getItem(scopedKey(APPROVAL_REQUESTS_KEY, scopeKey));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Partial<ApprovalRequest>>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeRequest)
      .filter((request): request is ApprovalRequest => Boolean(request))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function writeApprovalRequests(requests: ApprovalRequest[], scopeKey = "default") {
  localStorage.setItem(scopedKey(APPROVAL_REQUESTS_KEY, scopeKey), JSON.stringify(requests));
}

export function findApprovalRequestById(id: string, scopeKey = "default"): ApprovalRequest | null {
  return readApprovalRequests(scopeKey).find((request) => request.id === id) ?? null;
}

export function createApprovalRequest(input: CreateApprovalInput, scopeKey = "default"): ApprovalRequest {
  const requests = readApprovalRequests(scopeKey);

  const duplicate = requests.find((request) => {
    if (request.status !== "pending" || request.type !== input.type) return false;

    if (input.type === "large-discount") {
      return request.contextHash === input.contextHash && request.requestedBy === input.requestedBy;
    }

    return Boolean(input.saleId) && request.saleId === input.saleId;
  });

  if (duplicate) {
    return duplicate;
  }

  const next: ApprovalRequest = {
    id: `APR-${Date.now()}`,
    type: input.type,
    status: "pending",
    requestedBy: input.requestedBy,
    requestedRole: input.requestedRole,
    reason: input.reason.trim(),
    saleId: input.saleId,
    contextHash: input.contextHash,
    subtotal: input.subtotal,
    discountPercent: input.discountPercent,
    discountAmount: input.discountAmount,
    total: input.total,
    itemCount: input.itemCount,
    createdAt: new Date().toISOString()
  };

  writeApprovalRequests([next, ...requests], scopeKey);
  return next;
}

export function resolveApprovalRequest(
  requestId: string,
  decision: ApprovalDecision,
  resolvedBy: string,
  resolutionNote: string,
  scopeKey = "default"
): ApprovalRequest {
  const requests = readApprovalRequests(scopeKey);
  const index = requests.findIndex((request) => request.id === requestId);

  if (index < 0) {
    throw new Error("Permintaan approval tidak ditemukan.");
  }

  const current = requests[index];
  if (current.status !== "pending") {
    return current;
  }

  const updated: ApprovalRequest = {
    ...current,
    status: decision,
    resolvedAt: new Date().toISOString(),
    resolvedBy: resolvedBy.trim() || "unknown",
    resolutionNote: resolutionNote.trim()
  };

  requests[index] = updated;
  writeApprovalRequests(requests, scopeKey);
  return updated;
}
