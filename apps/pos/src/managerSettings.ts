export type ManagerSystemSettings = {
  showProductsSection: boolean;
  showReportsSection: boolean;
  showHistorySection: boolean;
  showCustomersSection: boolean;
  allowDataExport: boolean;
  allowApprovalDecision: boolean;
  allowProductDelete: boolean;
  allowStockAdjustment: boolean;
  updatedAt: string;
  updatedBy: string;
};

type ManagerSystemSettingsInput = Omit<
  ManagerSystemSettings,
  "updatedAt" | "updatedBy"
>;

const MANAGER_SETTINGS_KEY = "pos_manager_system_settings";

function scopedKey(baseKey: string, scopeKey: string) {
  return `${baseKey}:${scopeKey}`;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function defaultManagerSystemSettings(): ManagerSystemSettings {
  return {
    showProductsSection: true,
    showReportsSection: true,
    showHistorySection: true,
    showCustomersSection: true,
    allowDataExport: true,
    allowApprovalDecision: true,
    allowProductDelete: true,
    allowStockAdjustment: true,
    updatedAt: new Date().toISOString(),
    updatedBy: "system"
  };
}

function ensureAtLeastOneSectionVisible(settings: ManagerSystemSettingsInput): ManagerSystemSettingsInput {
  if (
    settings.showProductsSection ||
    settings.showReportsSection ||
    settings.showHistorySection ||
    settings.showCustomersSection
  ) {
    return settings;
  }

  return {
    ...settings,
    showReportsSection: true
  };
}

export function readManagerSystemSettings(scopeKey = "default"): ManagerSystemSettings {
  const raw = localStorage.getItem(scopedKey(MANAGER_SETTINGS_KEY, scopeKey));
  if (!raw) return defaultManagerSystemSettings();

  try {
    const parsed = JSON.parse(raw) as Partial<ManagerSystemSettings>;
    const fallback = defaultManagerSystemSettings();

    const normalizedInput = ensureAtLeastOneSectionVisible({
      showProductsSection: normalizeBoolean(parsed.showProductsSection, fallback.showProductsSection),
      showReportsSection: normalizeBoolean(parsed.showReportsSection, fallback.showReportsSection),
      showHistorySection: normalizeBoolean(parsed.showHistorySection, fallback.showHistorySection),
      showCustomersSection: normalizeBoolean(parsed.showCustomersSection, fallback.showCustomersSection),
      allowDataExport: normalizeBoolean(parsed.allowDataExport, fallback.allowDataExport),
      allowApprovalDecision: normalizeBoolean(
        parsed.allowApprovalDecision,
        fallback.allowApprovalDecision
      ),
      allowProductDelete: normalizeBoolean(parsed.allowProductDelete, fallback.allowProductDelete),
      allowStockAdjustment: normalizeBoolean(parsed.allowStockAdjustment, fallback.allowStockAdjustment)
    });

    return {
      ...normalizedInput,
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim().length > 0
          ? parsed.updatedAt
          : fallback.updatedAt,
      updatedBy:
        typeof parsed.updatedBy === "string" && parsed.updatedBy.trim().length > 0
          ? parsed.updatedBy
          : fallback.updatedBy
    };
  } catch {
    return defaultManagerSystemSettings();
  }
}

export function saveManagerSystemSettings(
  input: ManagerSystemSettingsInput,
  updatedBy: string,
  scopeKey = "default"
): ManagerSystemSettings {
  const nextInput = ensureAtLeastOneSectionVisible(input);

  const next: ManagerSystemSettings = {
    ...nextInput,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy.trim() || "unknown"
  };

  localStorage.setItem(scopedKey(MANAGER_SETTINGS_KEY, scopeKey), JSON.stringify(next));
  return next;
}

export type { ManagerSystemSettingsInput };
