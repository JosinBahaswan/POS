import { useEffect, useState } from "react";
import type { ApprovalRules } from "../approvals";
import type { AuditLogEntry } from "../auditLog";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import type { ManagerSystemSettings, ManagerSystemSettingsInput } from "../managerSettings";
import { OwnerAnalyticsGovernanceSection } from "../components/owner-analytics/OwnerAnalyticsGovernanceSection";
import { OwnerAnalyticsInsightsSection } from "../components/owner-analytics/OwnerAnalyticsInsightsSection";
import { OwnerAnalyticsKpiCards } from "../components/owner-analytics/OwnerAnalyticsKpiCards";
import { OwnerAnalyticsReportsSection } from "../components/owner-analytics/OwnerAnalyticsReportsSection";
import { OwnerAnalyticsStaffPerformance } from "../components/owner-analytics/OwnerAnalyticsStaffPerformance";
import type { OwnerAnalyticsPeriod } from "../components/owner-analytics/types";
import { downloadOwnerAnalyticsCsv, useOwnerAnalyticsData } from "../hooks/useOwnerAnalyticsData";

type OwnerAnalyticsPageProps = {
  sales: LocalSale[];
  products: ProductItem[];
  approvalRules: ApprovalRules;
  auditLogs: AuditLogEntry[];
  managerSettings: ManagerSystemSettings;
  onUpdateApprovalRules: (input: {
    largeDiscountPercentThreshold: number;
    requireRefundApproval: boolean;
    requireVoidApproval: boolean;
  }) => void;
  onUpdateManagerSettings: (input: ManagerSystemSettingsInput) => void;
};

function toManagerSettingsInput(settings: ManagerSystemSettings): ManagerSystemSettingsInput {
  return {
    showProductsSection: settings.showProductsSection,
    showReportsSection: settings.showReportsSection,
    showHistorySection: settings.showHistorySection,
    showCustomersSection: settings.showCustomersSection,
    allowDataExport: settings.allowDataExport,
    allowApprovalDecision: settings.allowApprovalDecision,
    allowProductDelete: settings.allowProductDelete,
    allowStockAdjustment: settings.allowStockAdjustment
  };
}

export function OwnerAnalyticsPage({
  sales,
  products,
  approvalRules,
  auditLogs,
  managerSettings,
  onUpdateApprovalRules,
  onUpdateManagerSettings
}: OwnerAnalyticsPageProps) {
  const [period, setPeriod] = useState<OwnerAnalyticsPeriod>("7d");
  const [threshold, setThreshold] = useState(approvalRules.largeDiscountPercentThreshold);
  const [requireRefundApproval, setRequireRefundApproval] = useState(approvalRules.requireRefundApproval);
  const [requireVoidApproval, setRequireVoidApproval] = useState(approvalRules.requireVoidApproval);
  const [managerSettingsDraft, setManagerSettingsDraft] = useState<ManagerSystemSettingsInput>(() =>
    toManagerSettingsInput(managerSettings)
  );

  useEffect(() => {
    setThreshold(approvalRules.largeDiscountPercentThreshold);
    setRequireRefundApproval(approvalRules.requireRefundApproval);
    setRequireVoidApproval(approvalRules.requireVoidApproval);
  }, [approvalRules]);

  useEffect(() => {
    setManagerSettingsDraft(toManagerSettingsInput(managerSettings));
  }, [managerSettings]);

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

  const saveManagerSettings = () => {
    onUpdateManagerSettings(managerSettingsDraft);
  };

  const exportAnalyticsJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      period,
      kpi: {
        omzet: analytics.periodRevenue,
        margin: analytics.periodMargin,
        marginPercent: analytics.periodMarginPercent,
        transactionCount: analytics.periodCompleted.length
      },
      sales: analytics.periodSales,
      outletSummary: analytics.outletSummary,
      topProducts: analytics.topProducts
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `owner-report-${period}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-4 grid gap-4">
      <section className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Owner Dashboard</p>
        <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl">Analytics, Governance, dan Pengawasan</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Omzet, margin, tren, aturan approval, audit log, dan laporan periodik outlet.</p>
      </section>

      <OwnerAnalyticsKpiCards analytics={analytics} />
      <OwnerAnalyticsStaffPerformance sales={sales} />
      <OwnerAnalyticsInsightsSection analytics={analytics} />

      <OwnerAnalyticsReportsSection
        period={period}
        onPeriodChange={setPeriod}
        onExportCsv={() => downloadOwnerAnalyticsCsv(period, analytics.periodSales)}
        onExportJson={exportAnalyticsJson}
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
        managerSettings={managerSettings}
        managerSettingsDraft={managerSettingsDraft}
        onManagerSettingsDraftChange={setManagerSettingsDraft}
        auditLogs={auditLogs}
        onSaveRules={saveRules}
        onSaveManagerSettings={saveManagerSettings}
      />
    </section>
  );
}
