import { useMemo, useState } from "react";
import type { ApprovalDecision, ApprovalRequest } from "../approvals";
import type { LocalSale } from "../database";
import type { ShiftSession } from "../shift";
import type { UserRole } from "../types";

type ManagerOperationsPanelProps = {
  role: UserRole;
  sales: LocalSale[];
  shifts: ShiftSession[];
  approvalRequests: ApprovalRequest[];
  onResolveRequest: (requestId: string, decision: ApprovalDecision, note: string) => Promise<void>;
};

type ShiftPerformanceRow = {
  shiftId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  trxCount: number;
  refundedCount: number;
  voidedCount: number;
  omzet: number;
};

function approvalLabel(type: ApprovalRequest["type"]) {
  switch (type) {
    case "large-discount":
      return "Diskon Besar";
    case "refund":
      return "Refund";
    default:
      return "Void";
  }
}

export function ManagerOperationsPanel({
  role,
  sales,
  shifts,
  approvalRequests,
  onResolveRequest
}: ManagerOperationsPanelProps) {
  const [requestError, setRequestError] = useState("");
  const [processingId, setProcessingId] = useState("");

  const dashboard = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todaySales = sales.filter((sale) => new Date(sale.createdAt).getTime() >= startToday);
    const completedToday = todaySales.filter((sale) => sale.status === "completed");
    const refundedToday = todaySales.filter((sale) => sale.status === "refunded");
    const voidedToday = todaySales.filter((sale) => sale.status === "voided");

    const omzetToday = completedToday.reduce((acc, sale) => acc + sale.total, 0);
    const pendingApprovals = approvalRequests.filter((request) => request.status === "pending");

    const shiftPerformance: ShiftPerformanceRow[] = shifts.slice(0, 10).map((shift) => {
      const shiftSales = sales.filter((sale) => sale.shiftId === shift.id);
      const shiftCompletedSales = shiftSales.filter((sale) => sale.status === "completed");

      return {
        shiftId: shift.id,
        cashierName: shift.openedByName || "Kasir",
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        trxCount: shiftCompletedSales.length,
        refundedCount: shiftSales.filter((sale) => sale.status === "refunded").length,
        voidedCount: shiftSales.filter((sale) => sale.status === "voided").length,
        omzet: shiftCompletedSales.reduce((acc, sale) => acc + sale.total, 0)
      };
    });

    return {
      omzetToday,
      completedCount: completedToday.length,
      refundedCount: refundedToday.length,
      voidedCount: voidedToday.length,
      pendingApprovals,
      shiftPerformance
    };
  }, [sales, shifts, approvalRequests]);

  const resolveRequest = async (request: ApprovalRequest, decision: ApprovalDecision) => {
    setRequestError("");
    setProcessingId(request.id);

    try {
      const note = window.prompt(
        decision === "approved"
          ? "Catatan approval (opsional)"
          : "Alasan penolakan (wajib)",
        ""
      );

      if (decision === "rejected" && (!note || note.trim().length === 0)) {
        throw new Error("Alasan penolakan wajib diisi.");
      }

      await onResolveRequest(request.id, decision, note ?? "");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Gagal memproses approval.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <section className="grid gap-4">
      <section className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
          {role === "owner" ? "Owner Oversight" : "Manager Control"}
        </p>
        <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl">Operasional Harian</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Approval refund/void/diskon besar, performa kasir per shift, dan ringkasan laporan harian.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Omzet Hari Ini</p>
          <p className="mt-2 font-headline text-lg font-extrabold text-primary sm:text-xl">Rp {dashboard.omzetToday.toLocaleString("id-ID")}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Transaksi Valid</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-surface">{dashboard.completedCount}</p>
        </article>
        <article className="rounded-2xl border border-error/10 bg-error-container/40 p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-error">Refund + Void</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-error">{dashboard.refundedCount + dashboard.voidedCount}</p>
        </article>
        <article className="rounded-2xl border border-tertiary/10 bg-tertiary-fixed/40 p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-tertiary-fixed-variant">Approval Pending</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-tertiary-fixed-variant">{dashboard.pendingApprovals.length}</p>
        </article>
      </section>

      <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Approval Queue</h3>

        {requestError && (
          <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container">
            {requestError}
          </p>
        )}

        {dashboard.pendingApprovals.length === 0 ? (
          <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
            Tidak ada approval pending.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {dashboard.pendingApprovals.map((request) => (
              <li key={request.id} className="rounded-xl bg-surface-container-lowest p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{approvalLabel(request.type)}</p>
                    <p className="text-xs text-on-surface-variant">
                      {request.id} • {request.requestedBy} • {new Date(request.createdAt).toLocaleString("id-ID")}
                    </p>
                    {request.saleId && (
                      <p className="text-xs text-on-surface-variant">Sale: {request.saleId}</p>
                    )}
                    {request.type === "large-discount" && (
                      <p className="text-xs text-on-surface-variant">
                        Diskon {request.discountPercent ?? 0}% | Total Rp {(request.total ?? 0).toLocaleString("id-ID")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-on-surface-variant">{request.reason || "Tanpa catatan"}</p>
                  </div>

                  <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-fixed-variant">
                    Pending
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={processingId === request.id}
                    onClick={() => {
                      void resolveRequest(request, "approved");
                    }}
                    className="h-9 rounded-lg bg-secondary-container text-xs font-semibold text-on-secondary-container disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={processingId === request.id}
                    onClick={() => {
                      void resolveRequest(request, "rejected");
                    }}
                    className="h-9 rounded-lg bg-error-container text-xs font-semibold text-on-error-container disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Performa Kasir per Shift</h3>

        {dashboard.shiftPerformance.length === 0 ? (
          <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
            Belum ada data shift.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {dashboard.shiftPerformance.map((row) => (
              <li key={row.shiftId} className="rounded-xl bg-surface-container-lowest p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{row.cashierName}</p>
                    <p className="text-xs text-on-surface-variant">{row.shiftId}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(row.openedAt).toLocaleString("id-ID")}
                      {row.closedAt ? ` - ${new Date(row.closedAt).toLocaleString("id-ID")}` : " - aktif"}
                    </p>
                  </div>
                  <p className="font-headline text-lg font-extrabold text-primary">Rp {row.omzet.toLocaleString("id-ID")}</p>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                    Trx: <span className="font-semibold text-on-surface">{row.trxCount}</span>
                  </p>
                  <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                    Refund: <span className="font-semibold text-on-surface">{row.refundedCount}</span>
                  </p>
                  <p className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">
                    Void: <span className="font-semibold text-on-surface">{row.voidedCount}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
