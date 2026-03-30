export type ProductHppProfile = {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  packagingCost: number;
  logisticsCost: number;
  otherCost: number;
  wastagePercent: number;
  taxPercent: number;
  targetMarginPercent: number;
  priceRounding: number;
};

type ProductCostSnapshot = {
  costPrice: number;
  hppProfile?: ProductHppProfile;
};

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeCurrency = (value: unknown) => Math.max(0, Math.round(toNumber(value)));

const clampPercent = (value: unknown, max = 100) =>
  Math.max(0, Math.min(max, toNumber(value)));

const normalizeRounding = (value: unknown) => {
  const numeric = Math.round(toNumber(value));
  return numeric > 0 ? numeric : 100;
};

const roundUpToUnit = (value: number, unit: number) => {
  if (value <= 0) return 0;
  if (unit <= 1) return Math.round(value);
  return Math.ceil(value / unit) * unit;
};

export function createDefaultProductHppProfile(materialCost = 0): ProductHppProfile {
  return {
    materialCost: normalizeCurrency(materialCost),
    laborCost: 0,
    overheadCost: 0,
    packagingCost: 0,
    logisticsCost: 0,
    otherCost: 0,
    wastagePercent: 0,
    taxPercent: 0,
    targetMarginPercent: 50,
    priceRounding: 100
  };
}

export function sanitizeProductHppProfile(
  profile: Partial<ProductHppProfile> | null | undefined,
  fallbackCost = 0
): ProductHppProfile {
  const normalized = createDefaultProductHppProfile(fallbackCost);

  if (!profile) {
    return normalized;
  }

  return {
    materialCost: normalizeCurrency(profile.materialCost ?? normalized.materialCost),
    laborCost: normalizeCurrency(profile.laborCost),
    overheadCost: normalizeCurrency(profile.overheadCost),
    packagingCost: normalizeCurrency(profile.packagingCost),
    logisticsCost: normalizeCurrency(profile.logisticsCost),
    otherCost: normalizeCurrency(profile.otherCost),
    wastagePercent: clampPercent(profile.wastagePercent),
    taxPercent: clampPercent(profile.taxPercent),
    targetMarginPercent: clampPercent(profile.targetMarginPercent, 95),
    priceRounding: normalizeRounding(profile.priceRounding)
  };
}

export function parseProductHppProfile(
  rawProfile: unknown,
  fallbackCost = 0
): ProductHppProfile | undefined {
  if (!rawProfile || typeof rawProfile !== "object") {
    return undefined;
  }

  const sanitized = sanitizeProductHppProfile(rawProfile as Partial<ProductHppProfile>, fallbackCost);
  const hasMeaningfulInput =
    sanitized.materialCost > 0 ||
    sanitized.laborCost > 0 ||
    sanitized.overheadCost > 0 ||
    sanitized.packagingCost > 0 ||
    sanitized.logisticsCost > 0 ||
    sanitized.otherCost > 0 ||
    sanitized.wastagePercent > 0 ||
    sanitized.taxPercent > 0 ||
    sanitized.targetMarginPercent > 0;

  return hasMeaningfulInput ? sanitized : undefined;
}

export function calculateAdvancedHpp(profile: ProductHppProfile) {
  const safeProfile = sanitizeProductHppProfile(profile);
  const baseCost =
    safeProfile.materialCost +
    safeProfile.laborCost +
    safeProfile.overheadCost +
    safeProfile.packagingCost +
    safeProfile.logisticsCost +
    safeProfile.otherCost;
  const wastageCost = Math.round((baseCost * safeProfile.wastagePercent) / 100);
  const taxableCost = baseCost + wastageCost;
  const taxCost = Math.round((taxableCost * safeProfile.taxPercent) / 100);
  const unitHpp = Math.max(0, Math.round(taxableCost + taxCost));

  const marginRatio = safeProfile.targetMarginPercent / 100;
  const suggestedRawPrice = marginRatio >= 0.95 ? unitHpp : unitHpp / (1 - marginRatio);
  const suggestedPrice = roundUpToUnit(suggestedRawPrice, safeProfile.priceRounding);

  return {
    baseCost,
    wastageCost,
    taxCost,
    unitHpp,
    suggestedPrice
  };
}

export function resolveEffectiveCostPrice(product: ProductCostSnapshot): number {
  const baseCost = normalizeCurrency(product.costPrice);
  const parsedProfile = parseProductHppProfile(product.hppProfile, baseCost);

  if (!parsedProfile) {
    return baseCost;
  }

  return calculateAdvancedHpp(parsedProfile).unitHpp;
}
