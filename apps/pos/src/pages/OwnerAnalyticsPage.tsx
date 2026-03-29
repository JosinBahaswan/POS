import { useEffect, useState } from "react";
import type { ApprovalRules } from "../approvals";
import type { AuditLogEntry } from "../auditLog";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import { OwnerAnalyticsGovernanceSection } from "../components/owner-analytics/OwnerAnalyticsGovernanceSection";
import { OwnerAnalyticsInsightsSection } from "../components/owner-analytics/OwnerAnalyticsInsightsSection";
import { OwnerAnalyticsKpiCards } from "../components/owner-analytics/OwnerAnalyticsKpiCards";
import { OwnerAnalyticsReportsSection } from "../components/owner-analytics/OwnerAnalyticsReportsSection";
import type { OwnerAnalyticsPeriod } from "../components/owner-analytics/types";
import { downloadOwnerAnalyticsCsv, useOwnerAnalyticsData } from "../hooks/useOwnerAnalyticsData";

type OwnerAnalyticsPageProps = {
  sales: LocalSale[];
  products: ProductItem[];
  approvalRules: ApprovalRules;
  auditLogs: AuditLogEntry[];
  onUpdateApprovalRules: (input: {
    largeDiscountPercentThreshold: number;
    requireRefundApproval: boolean;
    requireVoidApproval: boolean;
  }) => void;
};

export function OwnerAnalyticsPage({
  sales,
  products,
  approvalRules,
  auditLogs,
  onUpdateApprovalRules
}: OwnerAnalyticsPageProps) {
  const [period, setPeriod] = useState<OwnerAnalyticsPeriod>("7d");
  const [threshold, setThreshold] = useState(approvalRules.largeDiscountPercentThreshold);
  const [requireRefundApproval, setRequireRefundApproval] = useState(approvalRules.requireRefundApproval);
  const [requireVoidApproval, setRequireVoidApproval] = useState(approvalRules.requireVoidApproval);

  useEffect(() => {
    setThreshold(approvalRules.largeDiscountPercentThreshold);
    setRequireRefundApproval(approvalRules.requireRefundApproval);
    setRequireVoidApproval(approvalRules.requireVoidApproval);
  }, [approvalRules]);

  const analytics = useOwnerAnalyticsData({
    sales,
    products,
    period
  });

  const saveRules = () => {
    onUpdateApprovalRules({
      largeDiscountPercentThreshold: Math.max(0, Math.min(100, Math.round(threshold))),
      requireRefundApproval,
      requireVoidApproval
    });
  };

  return (
    <section className="mt-4 grid gap-4">
      <section className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Owner Dashboard</p>
        <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl">Analytics, Governance, dan Pengawasan</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Omzet, margin, tren, aturan approval, audit log, dan laporan periodik outlet.</p>
      </section>

      <OwnerAnalyticsKpiCards analytics={analytics} />
      <OwnerAnalyticsInsightsSection analytics={analytics} />

      <OwnerAnalyticsReportsSection
        period={period}
        onPeriodChange={setPeriod}
        onExportCsv={() => downloadOwnerAnalyticsCsv(period, analytics.periodSales)}
        analytics={analytics}
      />

      <OwnerAnalyticsGovernanceSection
        threshold={threshold}
        setThreshold={setThreshold}
        requireRefundApproval={requireRefundApproval}
        setRequireRefundApproval={setRequireRefundApproval}
        requireVoidApproval={requireVoidApproval}
        setRequireVoidApproval={setRequireVoidApproval}
        approvalRules={approvalRules}
        auditLogs={auditLogs}
        onSaveRules={saveRules}
      />
    </section>
  );
}
