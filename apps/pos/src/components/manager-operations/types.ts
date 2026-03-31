import type { ApprovalDecision, ApprovalRequest } from "../../approvals";
import type { LocalSale } from "../../database";
import type { ShiftSession } from "../../shift";
import type { UserRole } from "../../types";

export type ManagerOperationsPanelProps = {
  role: UserRole;
  sales: LocalSale[];
  shifts: ShiftSession[];
  approvalRequests: ApprovalRequest[];
  allowApprovalActions?: boolean;
  onResolveRequest?: (requestId: string, decision: ApprovalDecision, note: string) => Promise<void>;
};

export type ShiftPerformanceRow = {
  shiftId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  trxCount: number;
  refundedCount: number;
  voidedCount: number;
  omzet: number;
};

export type TeamInsightRow = {
  cashierName: string;
  completedCount: number;
  issueCount: number;
  totalCount: number;
  revenue: number;
  avgTicket: number;
  issueRate: number;
  discountRate: number;
};

export type ActiveApprovalDecision = {
  request: ApprovalRequest;
  decision: ApprovalDecision;
} | null;

export type DashboardSnapshot = {
  omzetToday: number;
  omzetYesterday: number;
  growthVsYesterday: number | null;
  avgTicketToday: number;
  issueRateToday: number;
  discountRateToday: number;
  completedCount: number;
  refundedCount: number;
  voidedCount: number;
  pendingApprovals: ApprovalRequest[];
  pendingApprovalsAged: Array<ApprovalRequest & { ageMinutes: number }>;
  pendingOver15m: number;
  pendingOver30m: number;
  avgApprovalResponseMinutes: number | null;
  completed7dCount: number;
  topTeam: TeamInsightRow[];
  coachingCandidates: TeamInsightRow[];
  recommendedActions: string[];
  shiftPerformance: ShiftPerformanceRow[];
};
