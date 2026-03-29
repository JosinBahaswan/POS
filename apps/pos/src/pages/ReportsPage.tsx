import { ManagerOperationsPanel } from "../components/ManagerOperationsPanel";
import { ReportsPanel } from "../components/ReportsPanel";
import type { ApprovalDecision, ApprovalRequest } from "../approvals";
import type { LocalSale } from "../database";
import type { ShiftSession } from "../shift";
import type { UserRole } from "../types";

type ReportsPageProps = {
  sales: LocalSale[];
  role: UserRole;
  shifts: ShiftSession[];
  approvalRequests: ApprovalRequest[];
  onResolveApprovalRequest?: (requestId: string, decision: ApprovalDecision, note: string) => Promise<void>;
};

export function ReportsPage({
  sales,
  role,
  shifts,
  approvalRequests,
  onResolveApprovalRequest
}: ReportsPageProps) {
  return (
    <section className="mt-4 grid gap-4">
      {role !== "cashier" && onResolveApprovalRequest && (
        <ManagerOperationsPanel
          role={role}
          sales={sales}
          shifts={shifts}
          approvalRequests={approvalRequests}
          onResolveRequest={onResolveApprovalRequest}
        />
      )}
      <ReportsPanel sales={sales} />
    </section>
  );
}
