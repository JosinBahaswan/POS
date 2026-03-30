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
  allowApprovalActions?: boolean;
  onResolveRequest?: (requestId: string, decision: ApprovalDecision, note: string) => Promise<void>;
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

type TeamInsightRow = {
  cashierName: string;
  completedCount: number;
  issueCount: number;
  totalCount: number;
  revenue: number;
  avgTicket: number;
  issueRate: number;
  discountRate: number;
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
  allowApprovalActions = true,
  onResolveRequest
}: ManagerOperationsPanelProps) {
  const [requestError, setRequestError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [activeDecision, setActiveDecision] = useState<{
    request: ApprovalRequest;
    decision: ApprovalDecision;
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");

  const dashboard = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    const now = new Date();
    const nowTs = now.getTime();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startYesterday = startToday - dayMs;
    const start7d = startToday - 6 * dayMs;

    const todaySales = sales.filter((sale) => new Date(sale.createdAt).getTime() >= startToday);
    const completedToday = todaySales.filter((sale) => sale.status === "completed");
    const refundedToday = todaySales.filter((sale) => sale.status === "refunded");
    const voidedToday = todaySales.filter((sale) => sale.status === "voided");

    const yesterdayCompleted = sales.filter((sale) => {
      const timestamp = new Date(sale.createdAt).getTime();
      return timestamp >= startYesterday && timestamp < startToday && sale.status === "completed";
    });

    const sales7d = sales.filter((sale) => new Date(sale.createdAt).getTime() >= start7d);
    const completed7d = sales7d.filter((sale) => sale.status === "completed");

    const omzetToday = completedToday.reduce((acc, sale) => acc + sale.total, 0);
    const omzetYesterday = yesterdayCompleted.reduce((acc, sale) => acc + sale.total, 0);
    const growthVsYesterday =
      omzetYesterday <= 0 ? null : ((omzetToday - omzetYesterday) / omzetYesterday) * 100;
    const subtotalToday = completedToday.reduce((acc, sale) => acc + sale.subtotal, 0);
    const discountToday = completedToday.reduce((acc, sale) => acc + sale.discountAmount, 0);
    const avgTicketToday = completedToday.length > 0 ? omzetToday / completedToday.length : 0;
    const issueRateToday =
      todaySales.length > 0 ? (refundedToday.length + voidedToday.length) / todaySales.length : 0;
    const discountRateToday = subtotalToday > 0 ? discountToday / subtotalToday : 0;

    const pendingApprovals = approvalRequests.filter((request) => request.status === "pending");
    const pendingApprovalsAged = pendingApprovals
      .map((request) => {
        const createdAt = new Date(request.createdAt).getTime();
        const ageMinutes = Math.max(0, Math.round((nowTs - createdAt) / (60 * 1000)));
        return {
          ...request,
          ageMinutes
        };
      })
      .sort((a, b) => b.ageMinutes - a.ageMinutes);
    const pendingOver15m = pendingApprovalsAged.filter((request) => request.ageMinutes >= 15).length;
    const pendingOver30m = pendingApprovalsAged.filter((request) => request.ageMinutes >= 30).length;

    const resolvedApprovals7d = approvalRequests.filter(
      (request) =>
        request.status !== "pending" &&
        request.resolvedAt &&
        new Date(request.resolvedAt).getTime() >= start7d
    );

    const approvalResponseMinutes = resolvedApprovals7d
      .map((request) => {
        if (!request.resolvedAt) return 0;
        const createdTs = new Date(request.createdAt).getTime();
        const resolvedTs = new Date(request.resolvedAt).getTime();
        return Math.max(0, Math.round((resolvedTs - createdTs) / (60 * 1000)));
      })
      .filter((minutes) => Number.isFinite(minutes));

    const avgApprovalResponseMinutes =
      approvalResponseMinutes.length > 0
        ? approvalResponseMinutes.reduce((acc, value) => acc + value, 0) / approvalResponseMinutes.length
        : null;

    const shiftCashierMap = new Map<string, string>(
      shifts.map((shift) => [shift.id, shift.openedByName || "Kasir"])
    );

    const teamMap = new Map<
      string,
      {
        completedCount: number;
        issueCount: number;
        totalCount: number;
        revenue: number;
        subtotal: number;
        discount: number;
      }
    >();

    for (const sale of sales7d) {
      const cashierName = sale.shiftId ? shiftCashierMap.get(sale.shiftId) ?? "Kasir" : "Kasir";
      const current = teamMap.get(cashierName) ?? {
        completedCount: 0,
        issueCount: 0,
        totalCount: 0,
        revenue: 0,
        subtotal: 0,
        discount: 0
      };

      current.totalCount += 1;
      if (sale.status === "completed") {
        current.completedCount += 1;
        current.revenue += sale.total;
        current.subtotal += sale.subtotal;
        current.discount += sale.discountAmount;
      } else if (sale.status === "refunded" || sale.status === "voided") {
        current.issueCount += 1;
      }

      teamMap.set(cashierName, current);
    }

    const teamInsights: TeamInsightRow[] = Array.from(teamMap.entries())
      .map(([cashierName, value]) => ({
        cashierName,
        completedCount: value.completedCount,
        issueCount: value.issueCount,
        totalCount: value.totalCount,
        revenue: value.revenue,
        avgTicket: value.completedCount > 0 ? value.revenue / value.completedCount : 0,
        issueRate: value.totalCount > 0 ? value.issueCount / value.totalCount : 0,
        discountRate: value.subtotal > 0 ? value.discount / value.subtotal : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topTeam = teamInsights.slice(0, 3);
    const coachingCandidates = teamInsights
      .filter((member) => member.totalCount >= 6 && member.issueRate >= 0.12)
      .sort((a, b) => b.issueRate - a.issueRate)
      .slice(0, 3);

    const recommendedActions: string[] = [];
    if (issueRateToday >= 0.08) {
      recommendedActions.push(
        "Rasio refund/void tinggi hari ini, cek 5 transaksi bermasalah terakhir dan pastikan SOP kasir dijalankan."
      );
    }
    if (discountRateToday >= 0.12) {
      recommendedActions.push(
        "Diskon terhadap subtotal cukup besar, evaluasi aturan promo dan minta alasan diskon pada transaksi bernilai tinggi."
      );
    }
    if (pendingOver15m > 0) {
      recommendedActions.push(
        `Ada ${pendingOver15m} approval menunggu >15 menit, atur giliran supervisor agar SLA persetujuan tetap cepat.`
      );
    }
    if (coachingCandidates.length > 0) {
      recommendedActions.push(
        `Jadwalkan coaching 1-on-1 untuk ${coachingCandidates.map((member) => member.cashierName).join(", ")} berdasarkan issue rate mingguan.`
      );
    }
    if (recommendedActions.length === 0) {
      recommendedActions.push(
        "Performa operasional stabil. Fokuskan briefing tim ke upselling bundling untuk menaikkan rata-rata nilai transaksi."
      );
    }

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
      omzetYesterday,
      growthVsYesterday,
      avgTicketToday,
      issueRateToday,
      discountRateToday,
      completedCount: completedToday.length,
      refundedCount: refundedToday.length,
      voidedCount: voidedToday.length,
      pendingApprovals,
      pendingApprovalsAged,
      pendingOver15m,
      pendingOver30m,
      avgApprovalResponseMinutes,
      completed7dCount: completed7d.length,
      topTeam,
      coachingCandidates,
      recommendedActions: recommendedActions.slice(0, 3),
      shiftPerformance
    };
  }, [sales, shifts, approvalRequests]);

  const openDecisionModal = (request: ApprovalRequest, decision: ApprovalDecision) => {
    if (!allowApprovalActions) {
      setRequestError("Owner menonaktifkan aksi approval untuk manager.");
      return;
    }

    setRequestError("");
    setDecisionError("");
    setDecisionNote("");
    setActiveDecision({ request, decision });
  };

  const closeDecisionModal = () => {
    if (processingId) return;
    setActiveDecision(null);
    setDecisionNote("");
    setDecisionError("");
  };

  const submitDecision = async () => {
    if (!activeDecision) return;
    if (!onResolveRequest) {
      setDecisionError("Aksi approval belum tersedia.");
      return;
    }

    const trimmedNote = decisionNote.trim();
    if (activeDecision.decision === "rejected" && trimmedNote.length === 0) {
      setDecisionError("Alasan penolakan wajib diisi.");
      return;
    }

    setRequestError("");
    setDecisionError("");
    setProcessingId(activeDecision.request.id);

    try {
      await onResolveRequest(activeDecision.request.id, activeDecision.decision, trimmedNote);
      setActiveDecision(null);
      setDecisionNote("");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Gagal memproses approval.");
      setDecisionError(error instanceof Error ? error.message : "Gagal memproses approval.");
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

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Avg Ticket Hari Ini</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">Rp {Math.round(dashboard.avgTicketToday).toLocaleString("id-ID")}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Rasio Diskon</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">{(dashboard.discountRateToday * 100).toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Issue Rate Hari Ini</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">{(dashboard.issueRateToday * 100).toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl border border-warning/20 bg-tertiary-fixed/35 p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-tertiary-fixed-variant">Pending 15+ Menit</p>
          <p className="mt-2 font-headline text-2xl font-extrabold text-on-tertiary-fixed-variant">{dashboard.pendingOver15m}</p>
        </article>
        <article className="rounded-2xl bg-surface-container-lowest p-4 editorial-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">SLA Approval (7H)</p>
          <p className="mt-2 font-headline text-xl font-extrabold text-on-surface">
            {dashboard.avgApprovalResponseMinutes === null
              ? "-"
              : `${Math.round(dashboard.avgApprovalResponseMinutes).toLocaleString("id-ID")} mnt`}
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Top Performa Tim (7 Hari)</h3>
          {dashboard.topTeam.length === 0 ? (
            <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Belum ada data performa tim.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {dashboard.topTeam.map((member, index) => (
                <li key={member.cashierName} className="rounded-xl bg-surface-container-lowest p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">#{index + 1} {member.cashierName}</p>
                      <p className="text-xs text-on-surface-variant">
                        Trx selesai: {member.completedCount} • Issue: {member.issueCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-headline text-base font-extrabold text-primary">Rp {Math.round(member.revenue).toLocaleString("id-ID")}</p>
                      <p className="text-[11px] text-on-surface-variant">Avg Ticket Rp {Math.round(member.avgTicket).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Perlu Pendampingan</h3>
          {dashboard.coachingCandidates.length === 0 ? (
            <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              Tidak ada kasir yang melewati ambang issue rate minggu ini.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {dashboard.coachingCandidates.map((member) => (
                <li key={member.cashierName} className="rounded-xl bg-surface-container-lowest p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{member.cashierName}</p>
                      <p className="text-xs text-on-surface-variant">
                        Issue rate {(member.issueRate * 100).toFixed(1)}% • Trx total {member.totalCount}
                      </p>
                    </div>
                    <span className="rounded-full bg-error-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-on-error-container">
                      Coaching
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Rekomendasi Aksi Manajer (24 Jam)</h3>
          <p className="text-xs font-semibold text-on-surface-variant">Trx 7 hari: {dashboard.completed7dCount}</p>
        </div>
        <ul className="mt-3 grid gap-2">
          {dashboard.recommendedActions.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
              {index + 1}. {item}
            </li>
          ))}
        </ul>
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
                    <p className="text-xs text-on-surface-variant">Usia request: {Math.max(0, Math.round((Date.now() - new Date(request.createdAt).getTime()) / (60 * 1000)))} menit</p>
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

                {allowApprovalActions ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={processingId === request.id}
                      onClick={() => openDecisionModal(request, "approved")}
                      className="h-9 rounded-lg bg-secondary-container text-xs font-semibold text-on-secondary-container disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={processingId === request.id}
                      onClick={() => openDecisionModal(request, "rejected")}
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

      {activeDecision && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 px-3 pb-4 pt-20 sm:items-center sm:p-6"
          onClick={closeDecisionModal}
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
                onClick={closeDecisionModal}
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
                onChange={(event) => setDecisionNote(event.target.value)}
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
                onClick={closeDecisionModal}
                disabled={Boolean(processingId)}
                className="h-10 rounded-xl bg-surface-container-high text-sm font-semibold text-on-surface-variant disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  void submitDecision();
                }}
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
      )}
    </section>
  );
}
