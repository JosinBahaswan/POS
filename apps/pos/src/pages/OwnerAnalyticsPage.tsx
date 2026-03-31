import { useEffect, useState } from "react";
import type { ApprovalRules } from "../approvals";
import type { AuditLogEntry } from "../auditLog";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import type { ManagerSystemSettings, ManagerSystemSettingsInput } from "../managerSettings";
import type { ShiftSession } from "../shift";
import { OwnerAnalyticsAdvancedSection } from "../components/owner-analytics/OwnerAnalyticsAdvancedSection";
import { OwnerAnalyticsGovernanceSection } from "../components/owner-analytics/OwnerAnalyticsGovernanceSection";
import { OwnerAnalyticsInsightsSection } from "../components/owner-analytics/OwnerAnalyticsInsightsSection";
import { OwnerAnalyticsKpiCards } from "../components/owner-analytics/OwnerAnalyticsKpiCards";
import { OwnerAnalyticsReportsSection } from "../components/owner-analytics/OwnerAnalyticsReportsSection";
import { OwnerAnalyticsStaffPerformance } from "../components/owner-analytics/OwnerAnalyticsStaffPerformance";
import type { OwnerAnalyticsPeriod } from "../components/owner-analytics/types";
import { downloadOwnerAnalyticsCsv, useOwnerAnalyticsData } from "../hooks/useOwnerAnalyticsData";

type OwnerAnalyticsPageProps = {
  sales: LocalSale[];
  shifts: ShiftSession[];
  products: ProductItem[];
  approvalRules: ApprovalRules;
  auditLogs: AuditLogEntry[];
  managerSettings: ManagerSystemSettings;
  onUpdateApprovalRules: (input: {
    largeDiscountPercentThreshold: number;
    minimumMarginPercentThreshold: number;
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

const MONTHLY_TARGET_STORAGE_KEY = "owner_analytics_monthly_target";

function readMonthlyTargetFromStorage() {
  if (typeof window === "undefined") return 0;

  try {
    const rawValue = window.localStorage.getItem(MONTHLY_TARGET_STORAGE_KEY);
    if (!rawValue) return 0;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
  } catch {
    return 0;
  }
}

export function OwnerAnalyticsPage({
  sales,
  shifts,
  products,
  approvalRules,
  auditLogs,
  managerSettings,
  onUpdateApprovalRules,
  onUpdateManagerSettings
}: OwnerAnalyticsPageProps) {
  const [period, setPeriod] = useState<OwnerAnalyticsPeriod>("7d");
  const [monthlyTarget, setMonthlyTarget] = useState<number>(() => readMonthlyTargetFromStorage());
  const [threshold, setThreshold] = useState(approvalRules.largeDiscountPercentThreshold);
  const [minimumMarginThreshold, setMinimumMarginThreshold] = useState(
    approvalRules.minimumMarginPercentThreshold
  );
  const [requireRefundApproval, setRequireRefundApproval] = useState(approvalRules.requireRefundApproval);
  const [requireVoidApproval, setRequireVoidApproval] = useState(approvalRules.requireVoidApproval);
  const [managerSettingsDraft, setManagerSettingsDraft] = useState<ManagerSystemSettingsInput>(() =>
    toManagerSettingsInput(managerSettings)
  );

  useEffect(() => {
    setThreshold(approvalRules.largeDiscountPercentThreshold);
    setMinimumMarginThreshold(approvalRules.minimumMarginPercentThreshold);
    setRequireRefundApproval(approvalRules.requireRefundApproval);
    setRequireVoidApproval(approvalRules.requireVoidApproval);
  }, [approvalRules]);

  useEffect(() => {
    setManagerSettingsDraft(toManagerSettingsInput(managerSettings));
  }, [managerSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MONTHLY_TARGET_STORAGE_KEY, String(Math.max(0, Math.round(monthlyTarget))));
    } catch {
      // ignore storage failures, analytics should still work without persistence
    }
  }, [monthlyTarget]);

  const analytics = useOwnerAnalyticsData({
    sales,
    products,
    period,
    monthlyTarget
  });

  const saveRules = () => {
    onUpdateApprovalRules({
      largeDiscountPercentThreshold: Math.max(0, Math.min(100, Math.round(threshold))),
      minimumMarginPercentThreshold: Math.max(0, Math.min(100, Math.round(minimumMarginThreshold))),
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
      topProducts: analytics.topProducts,
      monthlyTarget: analytics.monthlyTarget,
      monthlyTracking: {
        monthToDateRevenue: analytics.monthToDateRevenue,
        monthToDateTransactions: analytics.monthToDateTransactions,
        targetProgressPct: analytics.targetProgressPct,
        timeProgressPct: analytics.timeProgressPct,
        projectedMonthEndRevenue: analytics.projectedMonthEndRevenue,
        targetGap: analytics.targetGap
      },
      anomalyRadar: analytics.anomalyRadar,
      consistencyRadar: analytics.consistencyRadar,
      executionPlanner: analytics.executionPlanner,
      dailyMission: analytics.dailyMission,
      targetScenarioSimulator: analytics.targetScenarioSimulator,
      paymentMomentum: analytics.paymentMomentum
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
      <OwnerAnalyticsStaffPerformance sales={sales} shifts={shifts} />
      <OwnerAnalyticsInsightsSection analytics={analytics} />
      <OwnerAnalyticsAdvancedSection analytics={analytics} />

      <OwnerAnalyticsReportsSection
        period={period}
        onPeriodChange={setPeriod}
        monthlyTarget={monthlyTarget}
        onMonthlyTargetChange={setMonthlyTarget}
        onExportCsv={() => downloadOwnerAnalyticsCsv(period, analytics.periodSales)}
        onExportJson={exportAnalyticsJson}
        analytics={analytics}
      />

      <OwnerAnalyticsGovernanceSection
        threshold={threshold}
        setThreshold={setThreshold}
        minimumMarginThreshold={minimumMarginThreshold}
        setMinimumMarginThreshold={setMinimumMarginThreshold}
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
