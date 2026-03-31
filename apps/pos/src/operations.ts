export type InventoryUnit = {
  id: string;
  name: string;
  abbreviation: string;
};

export type RawMaterial = {
  id: string;
  name: string;
  unitId: string;
  stockQty: number;
  minStockQty: number;
  costPerUnit: number;
  supplierName?: string;
  createdAt: string;
  updatedAt: string;
};

export type UnitConversion = {
  id: string;
  fromUnitId: string;
  toUnitId: string;
  multiplier: number;
  note?: string;
};

export type RecipeStatus = "draft" | "active" | "archived";

export type RecipeIngredient = {
  materialId: string;
  quantity: number;
};

export type Recipe = {
  id: string;
  productId?: string;
  name: string;
  category: string;
  yieldPortions: number;
  durationMinutes: number;
  sellingPrice: number;
  status: RecipeStatus;
  ingredients: RecipeIngredient[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductBundle = {
  id: string;
  name: string;
  productIds: string[];
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StockOpnameItem = {
  id: string;
  materialId: string;
  systemQty: number;
  countedQty: number;
  variance: number;
};

export type StockOpnameSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  items: StockOpnameItem[];
};

export type JournalType = "income" | "expense" | "adjustment";

export type JournalEntry = {
  id: string;
  createdAt: string;
  type: JournalType;
  category: string;
  description: string;
  amount: number;
  referenceId?: string;
};

export type FailedProductEntry = {
  id: string;
  createdAt: string;
  productName: string;
  productId?: string;
  quantity: number;
  stockDeductedQty?: number;
  reason: string;
  estimatedLoss: number;
};

export type PromotionScheme = "percent" | "nominal" | "bundle" | "happy_hour";

export type OpsPromotion = {
  id: string;
  name: string;
  scheme: PromotionScheme;
  value: number;
  startAt?: string;
  endAt?: string;
  isActive: boolean;
  createdAt: string;
};

export type OperationsDataset = {
  units: InventoryUnit[];
  materials: RawMaterial[];
  conversions: UnitConversion[];
  recipes: Recipe[];
  bundles: ProductBundle[];
  stockOpnames: StockOpnameSession[];
  journals: JournalEntry[];
  failedProducts: FailedProductEntry[];
  promotions: OpsPromotion[];
};

const STORAGE_KEY = "pos_operations_dataset";

function scopedKey(scopeKey: string) {
  return `${STORAGE_KEY}:${scopeKey}`;
}

function nowIso() {
  return new Date().toISOString();
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function createOpsId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function createSeedOperationsDataset(): OperationsDataset {
  const ts = nowIso();

  return {
    units: [
      { id: "UNIT-KG", name: "Kilogram", abbreviation: "kg" },
      { id: "UNIT-G", name: "Gram", abbreviation: "g" },
      { id: "UNIT-L", name: "Liter", abbreviation: "l" },
      { id: "UNIT-ML", name: "Mililiter", abbreviation: "ml" },
      { id: "UNIT-PCS", name: "Pieces", abbreviation: "pcs" }
    ],
    materials: [
      {
        id: "MAT-001",
        name: "Tepung Terigu",
        unitId: "UNIT-KG",
        stockQty: 24,
        minStockQty: 8,
        costPerUnit: 12500,
        supplierName: "CV Pangan Jaya",
        createdAt: ts,
        updatedAt: ts
      },
      {
        id: "MAT-002",
        name: "Gula Pasir",
        unitId: "UNIT-KG",
        stockQty: 16,
        minStockQty: 6,
        costPerUnit: 14000,
        supplierName: "CV Pangan Jaya",
        createdAt: ts,
        updatedAt: ts
      },
      {
        id: "MAT-003",
        name: "Mentega Unsalted",
        unitId: "UNIT-KG",
        stockQty: 9,
        minStockQty: 5,
        costPerUnit: 74000,
        supplierName: "PT Dairy Nusantara",
        createdAt: ts,
        updatedAt: ts
      },
      {
        id: "MAT-004",
        name: "Susu Full Cream",
        unitId: "UNIT-L",
        stockQty: 12,
        minStockQty: 4,
        costPerUnit: 22000,
        supplierName: "PT Dairy Nusantara",
        createdAt: ts,
        updatedAt: ts
      }
    ],
    conversions: [
      {
        id: "CONV-001",
        fromUnitId: "UNIT-KG",
        toUnitId: "UNIT-G",
        multiplier: 1000,
        note: "1 kg = 1000 g"
      },
      {
        id: "CONV-002",
        fromUnitId: "UNIT-L",
        toUnitId: "UNIT-ML",
        multiplier: 1000,
        note: "1 l = 1000 ml"
      }
    ],
    recipes: [],
    bundles: [],
    stockOpnames: [],
    journals: [
      {
        id: "JRN-OPENING",
        createdAt: ts,
        type: "adjustment",
        category: "Saldo Awal",
        description: "Inisialisasi workspace operasional",
        amount: 0
      }
    ],
    failedProducts: [],
    promotions: []
  };
}

function normalizeUnit(raw: unknown): InventoryUnit | null {
  const unit = raw as Partial<InventoryUnit>;
  if (!unit || typeof unit.id !== "string" || typeof unit.name !== "string" || typeof unit.abbreviation !== "string") {
    return null;
  }

  return {
    id: unit.id,
    name: unit.name,
    abbreviation: unit.abbreviation
  };
}

function normalizeMaterial(raw: unknown): RawMaterial | null {
  const item = raw as Partial<RawMaterial>;
  if (!item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.unitId !== "string") {
    return null;
  }

  const createdAt = typeof item.createdAt === "string" ? item.createdAt : nowIso();
  const updatedAt = typeof item.updatedAt === "string" ? item.updatedAt : createdAt;

  return {
    id: item.id,
    name: item.name,
    unitId: item.unitId,
    stockQty: Math.max(0, Number(item.stockQty || 0)),
    minStockQty: Math.max(0, Number(item.minStockQty || 0)),
    costPerUnit: Math.max(0, Number(item.costPerUnit || 0)),
    supplierName: typeof item.supplierName === "string" ? item.supplierName : undefined,
    createdAt,
    updatedAt
  };
}

function normalizeConversion(raw: unknown): UnitConversion | null {
  const item = raw as Partial<UnitConversion>;
  if (!item || typeof item.id !== "string" || typeof item.fromUnitId !== "string" || typeof item.toUnitId !== "string") {
    return null;
  }

  return {
    id: item.id,
    fromUnitId: item.fromUnitId,
    toUnitId: item.toUnitId,
    multiplier: Math.max(0, Number(item.multiplier || 0)),
    note: typeof item.note === "string" ? item.note : undefined
  };
}

function normalizeRecipe(raw: unknown): Recipe | null {
  const item = raw as Partial<Recipe>;
  if (!item || typeof item.id !== "string" || typeof item.name !== "string") {
    return null;
  }

  const ingredients = toArray<Partial<RecipeIngredient>>(item.ingredients)
    .map((ingredient) => {
      if (!ingredient || typeof ingredient.materialId !== "string") return null;

      return {
        materialId: ingredient.materialId,
        quantity: Math.max(0, Number(ingredient.quantity || 0))
      } satisfies RecipeIngredient;
    })
    .filter((ingredient): ingredient is RecipeIngredient => ingredient !== null && ingredient.quantity > 0);

  const status = item.status === "active" || item.status === "archived" ? item.status : "draft";
  const createdAt = typeof item.createdAt === "string" ? item.createdAt : nowIso();
  const updatedAt = typeof item.updatedAt === "string" ? item.updatedAt : createdAt;

  return {
    id: item.id,
    productId: typeof item.productId === "string" && item.productId.trim().length > 0 ? item.productId : undefined,
    name: item.name,
    category: typeof item.category === "string" ? item.category : "Resep",
    yieldPortions: Math.max(1, Math.round(Number(item.yieldPortions || 1))),
    durationMinutes: Math.max(0, Math.round(Number(item.durationMinutes || 0))),
    sellingPrice: Math.max(0, Number(item.sellingPrice || 0)),
    status,
    ingredients,
    notes: typeof item.notes === "string" ? item.notes : undefined,
    createdAt,
    updatedAt
  };
}

function normalizeBundle(raw: unknown): ProductBundle | null {
  const item = raw as Partial<ProductBundle>;
  if (!item || typeof item.id !== "string" || typeof item.name !== "string") {
    return null;
  }

  const createdAt = typeof item.createdAt === "string" ? item.createdAt : nowIso();
  const updatedAt = typeof item.updatedAt === "string" ? item.updatedAt : createdAt;

  return {
    id: item.id,
    name: item.name,
    productIds: toArray<string>(item.productIds).filter((id) => typeof id === "string" && id.trim().length > 0),
    discountPercent: Math.max(0, Math.min(100, Number(item.discountPercent || 0))),
    isActive: Boolean(item.isActive),
    createdAt,
    updatedAt
  };
}

function normalizeOpnameItem(raw: unknown): StockOpnameItem | null {
  const item = raw as Partial<StockOpnameItem>;
  if (!item || typeof item.id !== "string" || typeof item.materialId !== "string") {
    return null;
  }

  const systemQty = Math.max(0, Number(item.systemQty || 0));
  const countedQty = Math.max(0, Number(item.countedQty || 0));

  return {
    id: item.id,
    materialId: item.materialId,
    systemQty,
    countedQty,
    variance: countedQty - systemQty
  };
}

function normalizeOpname(raw: unknown): StockOpnameSession | null {
  const session = raw as Partial<StockOpnameSession>;
  if (!session || typeof session.id !== "string" || typeof session.startedAt !== "string") {
    return null;
  }

  const items = toArray<unknown>(session.items)
    .map(normalizeOpnameItem)
    .filter((item): item is StockOpnameItem => item !== null);

  return {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: typeof session.endedAt === "string" ? session.endedAt : undefined,
    notes: typeof session.notes === "string" ? session.notes : undefined,
    items
  };
}

function normalizeJournal(raw: unknown): JournalEntry | null {
  const item = raw as Partial<JournalEntry>;
  if (!item || typeof item.id !== "string" || typeof item.createdAt !== "string") {
    return null;
  }

  const type: JournalType = item.type === "income" || item.type === "expense" ? item.type : "adjustment";

  return {
    id: item.id,
    createdAt: item.createdAt,
    type,
    category: typeof item.category === "string" ? item.category : "Lainnya",
    description: typeof item.description === "string" ? item.description : "",
    amount: Math.max(0, Number(item.amount || 0)),
    referenceId: typeof item.referenceId === "string" ? item.referenceId : undefined
  };
}

function normalizeFailedProduct(raw: unknown): FailedProductEntry | null {
  const item = raw as Partial<FailedProductEntry>;
  if (!item || typeof item.id !== "string" || typeof item.createdAt !== "string" || typeof item.productName !== "string") {
    return null;
  }

  return {
    id: item.id,
    createdAt: item.createdAt,
    productName: item.productName,
    productId: typeof item.productId === "string" && item.productId.trim().length > 0 ? item.productId : undefined,
    quantity: Math.max(0, Number(item.quantity || 0)),
    stockDeductedQty:
      item.stockDeductedQty === undefined
        ? undefined
        : Math.max(0, Number(item.stockDeductedQty || 0)),
    reason: typeof item.reason === "string" ? item.reason : "",
    estimatedLoss: Math.max(0, Number(item.estimatedLoss || 0))
  };
}

function normalizePromotion(raw: unknown): OpsPromotion | null {
  const item = raw as Partial<OpsPromotion>;
  if (!item || typeof item.id !== "string" || typeof item.name !== "string" || typeof item.createdAt !== "string") {
    return null;
  }

  const scheme: PromotionScheme =
    item.scheme === "nominal" || item.scheme === "bundle" || item.scheme === "happy_hour"
      ? item.scheme
      : "percent";

  return {
    id: item.id,
    name: item.name,
    scheme,
    value: Math.max(0, Number(item.value || 0)),
    startAt: typeof item.startAt === "string" ? item.startAt : undefined,
    endAt: typeof item.endAt === "string" ? item.endAt : undefined,
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt
  };
}

function normalizeOperationsDataset(raw: unknown): OperationsDataset {
  const seed = createSeedOperationsDataset();
  const candidate = raw as Partial<OperationsDataset>;

  const units = toArray<unknown>(candidate.units)
    .map(normalizeUnit)
    .filter((item): item is InventoryUnit => item !== null);

  const materials = toArray<unknown>(candidate.materials)
    .map(normalizeMaterial)
    .filter((item): item is RawMaterial => item !== null);

  const conversions = toArray<unknown>(candidate.conversions)
    .map(normalizeConversion)
    .filter((item): item is UnitConversion => item !== null);

  const recipes = toArray<unknown>(candidate.recipes)
    .map(normalizeRecipe)
    .filter((item): item is Recipe => item !== null);

  const bundles = toArray<unknown>(candidate.bundles)
    .map(normalizeBundle)
    .filter((item): item is ProductBundle => item !== null);

  const stockOpnames = toArray<unknown>(candidate.stockOpnames)
    .map(normalizeOpname)
    .filter((item): item is StockOpnameSession => item !== null)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const journals = toArray<unknown>(candidate.journals)
    .map(normalizeJournal)
    .filter((item): item is JournalEntry => item !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const failedProducts = toArray<unknown>(candidate.failedProducts)
    .map(normalizeFailedProduct)
    .filter((item): item is FailedProductEntry => item !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const promotions = toArray<unknown>(candidate.promotions)
    .map(normalizePromotion)
    .filter((item): item is OpsPromotion => item !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    units: units.length > 0 ? units : seed.units,
    materials: materials.length > 0 ? materials : seed.materials,
    conversions: conversions.length > 0 ? conversions : seed.conversions,
    recipes,
    bundles,
    stockOpnames,
    journals,
    failedProducts,
    promotions
  };
}

export function readOperationsDataset(scopeKey = "default"): OperationsDataset {
  if (typeof window === "undefined") {
    return createSeedOperationsDataset();
  }

  const raw = window.localStorage.getItem(scopedKey(scopeKey));
  if (!raw) {
    return createSeedOperationsDataset();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeOperationsDataset(parsed);
  } catch {
    return createSeedOperationsDataset();
  }
}

export function writeOperationsDataset(dataset: OperationsDataset, scopeKey = "default") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(scopeKey), JSON.stringify(dataset));
}
