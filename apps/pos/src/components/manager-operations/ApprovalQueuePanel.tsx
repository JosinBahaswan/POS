import { useEffect, useMemo, useState } from "react";
import type { ApprovalDecision, ApprovalRequest } from "../../approvals";
import { approvalAgeMinutesAt, approvalLabel, approvalTypePriority } from "./utils";

const APPROVAL_SLA_MINUTES = 15;
const APPROVAL_DUE_SOON_MINUTES = 5;

type RankedApprovalRequest = ApprovalRequest & {
  ageMinutes: number;
  remainingMinutes: number;
  priorityBand: "breached" | "due-soon" | "normal";
};

type ApprovalQueuePanelProps = {
  requests: ApprovalRequest[];
  requestError: string;
  allowApprovalActions: boolean;
  processingId: string;
  onOpenDecisionModal: (request: ApprovalRequest, decision: ApprovalDecision) => void;
};

export function ApprovalQueuePanel({
  requests,
  requestError,
  allowApprovalActions,
  processingId,
  onOpenDecisionModal
}: ApprovalQueuePanelProps) {
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTs(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const rankedRequests = useMemo<RankedApprovalRequest[]>(() => {
    const withMetrics = requests.map((request) => {
      const ageMinutes = approvalAgeMinutesAt(request.createdAt, nowTs);
      const remainingMinutes = APPROVAL_SLA_MINUTES - ageMinutes;

      let priorityBand: RankedApprovalRequest["priorityBand"] = "normal";
      if (remainingMinutes <= 0) {
        priorityBand = "breached";
      } else if (remainingMinutes <= APPROVAL_DUE_SOON_MINUTES) {
        priorityBand = "due-soon";
      }

      return {
        ...request,
        ageMinutes,
        remainingMinutes,
        priorityBand
      };
    });

    return withMetrics.sort((a, b) => {
      if (a.priorityBand === "breached" && b.priorityBand !== "breached") return -1;
      if (b.priorityBand === "breached" && a.priorityBand !== "breached") return 1;

      if (a.priorityBand === "breached" && b.priorityBand === "breached") {
        if (a.ageMinutes !== b.ageMinutes) return b.ageMinutes - a.ageMinutes;
      } else if (a.remainingMinutes !== b.remainingMinutes) {
        return a.remainingMinutes - b.remainingMinutes;
      }

      const typePriorityDiff = approvalTypePriority(b.type) - approvalTypePriority(a.type);
      if (typePriorityDiff !== 0) return typePriorityDiff;

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [requests, nowTs]);

  const breachedCount = rankedRequests.filter((request) => request.priorityBand === "breached").length;
  const dueSoonCount = rankedRequests.filter((request) => request.priorityBand === "due-soon").length;

  return (
    <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Approval Queue</h3>

      {requestError && (
        <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
          {requestError}
        </p>
      )}

      {requests.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-center text-[11px] text-on-surface-variant">
            Pending
            <span className="mt-1 block text-sm font-bold text-on-surface">{requests.length}</span>
          </p>
          <p className="rounded-xl bg-tertiary-fixed/40 px-3 py-2 text-center text-[11px] text-on-tertiary-fixed-variant">
            Due Soon
            <span className="mt-1 block text-sm font-bold text-on-tertiary-fixed-variant">{dueSoonCount}</span>
          </p>
          <p className="rounded-xl bg-error-container/70 px-3 py-2 text-center text-[11px] text-on-error-container">
            Lewat SLA
            <span className="mt-1 block text-sm font-bold text-on-error-container">{breachedCount}</span>
          </p>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
          Tidak ada approval pending.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {rankedRequests.map((request) => (
            <li
              key={request.id}
              className={
                request.priorityBand === "breached"
                  ? "rounded-xl border border-error/25 bg-error-container/30 p-3"
                  : request.priorityBand === "due-soon"
                    ? "rounded-xl border border-tertiary/20 bg-tertiary-fixed/25 p-3"
                    : "rounded-xl bg-surface-container-lowest p-3"
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{approvalLabel(request.type)}</p>
                  <p className="text-xs text-on-surface-variant">
                    {request.id} • {request.requestedBy} • {new Date(request.createdAt).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-on-surface-variant">Usia request: {request.ageMinutes} menit</p>
                  {request.saleId && <p className="text-xs text-on-surface-variant">Sale: {request.saleId}</p>}
                  {request.type === "large-discount" && (
                    <p className="text-xs text-on-surface-variant">
                      Diskon {request.discountPercent ?? 0}% | Total Rp {(request.total ?? 0).toLocaleString("id-ID")}
                    </p>
                  )}
                  {request.type === "loss-risk" && (
                    <p className="text-xs text-on-surface-variant">
                      Risiko margin checkout | Total Rp {(request.total ?? 0).toLocaleString("id-ID")} | Qty {request.itemCount ?? 0}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-on-surface-variant">{request.reason || "Tanpa catatan"}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-fixed-variant">
                    Pending
                  </span>
                  <span
                    className={
                      request.priorityBand === "breached"
                        ? "rounded-full bg-error px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-error"
                        : request.priorityBand === "due-soon"
                          ? "rounded-full bg-tertiary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-container"
                          : "rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant"
                    }
                  >
                    {request.priorityBand === "breached"
                      ? `Lewat SLA +${Math.abs(request.remainingMinutes)}m`
                      : `SLA ${request.remainingMinutes}m`}
                  </span>
                </div>
              </div>

              {allowApprovalActions ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={processingId === request.id}
                    onClick={() => onOpenDecisionModal(request, "approved")}
                    className="h-9 rounded-lg bg-secondary-container text-xs font-semibold text-on-secondary-container disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === request.id}
                    onClick={() => onOpenDecisionModal(request, "rejected")}
                    className="h-9 rounded-lg bg-error-container text-xs font-semibold text-on-error-container disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="mt-2 rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                  Aksi approval dinonaktifkan oleh owner.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
