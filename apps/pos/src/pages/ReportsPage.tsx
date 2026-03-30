import { ManagerOperationsPanel } from "../components/ManagerOperationsPanel";
import { ReportsPanel } from "../components/ReportsPanel";
import type { ApprovalDecision, ApprovalRequest } from "../approvals";
import type { Customer } from "../types";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import type { ShiftSession } from "../shift";
import type { UserRole } from "../types";

type ReportsPageProps = {
  sales: LocalSale[];
  role: UserRole;
  shifts: ShiftSession[];
  approvalRequests: ApprovalRequest[];
  products: ProductItem[];
  customers: Customer[];
  managerCanExportData: boolean;
  managerCanResolveApproval: boolean;
  onResolveApprovalRequest?: (requestId: string, decision: ApprovalDecision, note: string) => Promise<void>;
};

export function ReportsPage({
  sales,
  role,
  shifts,
  approvalRequests,
  products,
  customers,
  managerCanExportData,
  managerCanResolveApproval,
  onResolveApprovalRequest
}: ReportsPageProps) {
  return (
    <section className="mt-4 grid gap-4">
      {role !== "cashier" && (
        <ManagerOperationsPanel
          role={role}
          sales={sales}
          shifts={shifts}
          approvalRequests={approvalRequests}
          allowApprovalActions={(managerCanResolveApproval || role === "owner") && Boolean(onResolveApprovalRequest)}
          onResolveRequest={onResolveApprovalRequest}
        />
      )}
      <ReportsPanel
        sales={sales}
        shifts={shifts}
        approvalRequests={approvalRequests}
        products={products}
        customers={customers}
        exportEnabled={managerCanExportData || role === "owner"}
      />
    </section>
  );
}
