import { useState } from "react";
import type { ApprovalDecision, ApprovalRequest } from "../approvals";
import {
  ApprovalDecisionModal,
  ApprovalQueuePanel,
  ManagerOverviewPanels,
  ShiftPerformancePanel,
  TeamInsightsPanels,
  type ActiveApprovalDecision,
  type ManagerOperationsPanelProps,
  useManagerOperationsDashboard
} from "./manager-operations";

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
  const [activeDecision, setActiveDecision] = useState<ActiveApprovalDecision>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");

  const dashboard = useManagerOperationsDashboard(sales, shifts, approvalRequests);

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
      <ManagerOverviewPanels role={role} dashboard={dashboard} />

      <TeamInsightsPanels dashboard={dashboard} />

      <ApprovalQueuePanel
        requests={dashboard.pendingApprovals}
        requestError={requestError}
        allowApprovalActions={allowApprovalActions}
        processingId={processingId}
        onOpenDecisionModal={openDecisionModal}
      />

      <ShiftPerformancePanel shiftPerformance={dashboard.shiftPerformance} />

      <ApprovalDecisionModal
        activeDecision={activeDecision}
        processingId={processingId}
        decisionNote={decisionNote}
        decisionError={decisionError}
        onDecisionNoteChange={setDecisionNote}
        onClose={closeDecisionModal}
        onSubmit={() => {
          void submitDecision();
        }}
      />
    </section>
  );
}
