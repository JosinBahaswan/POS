import { useMemo } from "react";
import type { ApprovalRequest } from "../../approvals";
import type { LocalSale } from "../../database";
import type { ShiftSession } from "../../shift";
import type { DashboardSnapshot, ShiftPerformanceRow, TeamInsightRow } from "./types";

export function useManagerOperationsDashboard(
  sales: LocalSale[],
  shifts: ShiftSession[],
  approvalRequests: ApprovalRequest[]
): DashboardSnapshot {
  return useMemo(() => {
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
}
