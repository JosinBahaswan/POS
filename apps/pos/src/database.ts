import type { CartItem, PaymentBreakdown, PaymentMethod, TransactionStatus, Customer } from "./types";
import type { ProductItem } from "./localData";
import { parseProductHppProfile, resolveEffectiveCostPrice } from "./hpp";

export type LocalSale = {
  id: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  manualDiscountAmount?: number;
  autoPromotionAmount?: number;
  appliedPromotionNames?: string[];
  appliedBundleNames?: string[];
  materialUsage?: Array<{
    materialId: string;
    quantity: number;
    recipeId?: string;
    recipeName?: string;
    productId?: string;
  }>;
  redeemedPoints?: number;
  redeemedAmount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: PaymentBreakdown;
  shiftId?: string;
  outletId?: string;
  cashierId?: string;
  cashierName?: string;
  customerId?: string;
  earnedPoints?: number;
  status: TransactionStatus;
  approvalRequestId?: string;
  approvedBy?: string;
  synced: boolean;
  createdAt: string;
  items: CartItem[];
};

const STORAGE_KEY = "pos_local_sales";
const PRODUCTS_KEY = "pos_products";
const CUSTOMERS_KEY = "pos_customers";

function scopedKey(baseKey: string, scopeKey: string) {
  return `${baseKey}:${scopeKey}`;
}

function normalizeTransactionStatus(value: unknown): TransactionStatus {
  if (value === "refunded" || value === "voided") return value;
  return "completed";
}

function normalizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((raw) => {
      const item = raw as Partial<CartItem>;
      if (!item.id || !item.name) return null;

      const qty = Math.max(0, Math.round(Number(item.qty || 0)));
      const price = Math.max(0, Number(item.price || 0));
      if (qty <= 0) return null;

      const normalized: CartItem = {
        id: item.id,
        name: item.name,
        qty,
        price
      };

      if (item.basePrice !== undefined) {
        normalized.basePrice = Math.max(0, Number(item.basePrice || 0));
      }
      if (item.promoPercent !== undefined) {
        normalized.promoPercent = Math.max(0, Math.min(100, Number(item.promoPercent || 0)));
      }
      if (item.costPrice !== undefined) {
        normalized.costPrice = Math.max(0, Number(item.costPrice || 0));
      }

      return normalized;
    })
    .filter((item): item is CartItem => item !== null);
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeMaterialUsage(value: unknown): LocalSale["materialUsage"] {
  if (!Array.isArray(value)) return undefined;

  const normalized: NonNullable<LocalSale["materialUsage"]> = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;

    const raw = entry as {
      materialId?: unknown;
      quantity?: unknown;
      recipeId?: unknown;
      recipeName?: unknown;
      productId?: unknown;
    };

    if (typeof raw.materialId !== "string" || raw.materialId.trim().length === 0) continue;

    const quantity = Math.max(0, Number(raw.quantity || 0));
    if (quantity <= 0) continue;

    normalized.push({
      materialId: raw.materialId.trim(),
      quantity,
      recipeId: typeof raw.recipeId === "string" && raw.recipeId.trim().length > 0 ? raw.recipeId.trim() : undefined,
      recipeName: typeof raw.recipeName === "string" && raw.recipeName.trim().length > 0 ? raw.recipeName.trim() : undefined,
      productId: typeof raw.productId === "string" && raw.productId.trim().length > 0 ? raw.productId.trim() : undefined
    });
  }

  return normalized.length > 0 ? normalized : undefined;
}

export function saveLocalSale(
  sale: Omit<LocalSale, "synced" | "status"> & { status?: TransactionStatus },
  scopeKey = "default"
) {
  const current = readLocalSales(scopeKey);
  const next = [{ ...sale, status: sale.status ?? "completed", synced: false }, ...current];
  localStorage.setItem(scopedKey(STORAGE_KEY, scopeKey), JSON.stringify(next));
}

export function markSalesSynced(ids: string[], scopeKey = "default") {
  const current = readLocalSales(scopeKey);
  const idSet = new Set(ids);
  const next = current.map((sale) =>
    idSet.has(sale.id) ? { ...sale, synced: true } : sale
  );
  localStorage.setItem(scopedKey(STORAGE_KEY, scopeKey), JSON.stringify(next));
}

export function readLocalSales(scopeKey = "default"): LocalSale[] {
  const raw = localStorage.getItem(scopedKey(STORAGE_KEY, scopeKey));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalSale[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((sale) => ({
      ...sale,
      status: normalizeTransactionStatus(sale.status),
      outletId: sale.outletId || "MAIN",
      cashierId:
        typeof sale.cashierId === "string" && sale.cashierId.trim().length > 0
          ? sale.cashierId.trim()
          : undefined,
      cashierName:
        typeof sale.cashierName === "string" && sale.cashierName.trim().length > 0
          ? sale.cashierName.trim()
          : undefined,
      paymentBreakdown: sale.paymentBreakdown
        ? {
            cash: Number(sale.paymentBreakdown.cash || 0),
            card: Number(sale.paymentBreakdown.card || 0),
            qris: Number(sale.paymentBreakdown.qris || 0)
          }
        : undefined,
      earnedPoints:
        sale.earnedPoints === undefined
          ? undefined
          : Math.max(0, Math.round(Number(sale.earnedPoints || 0))),
      redeemedPoints:
        sale.redeemedPoints === undefined
          ? undefined
          : Math.max(0, Math.round(Number(sale.redeemedPoints || 0))),
      redeemedAmount:
        sale.redeemedAmount === undefined
          ? undefined
          : Math.max(0, Number(sale.redeemedAmount || 0)),
      manualDiscountAmount:
        sale.manualDiscountAmount === undefined
          ? undefined
          : Math.max(0, Number(sale.manualDiscountAmount || 0)),
      autoPromotionAmount:
        sale.autoPromotionAmount === undefined
          ? undefined
          : Math.max(0, Number(sale.autoPromotionAmount || 0)),
      appliedPromotionNames: normalizeStringArray(sale.appliedPromotionNames),
      appliedBundleNames: normalizeStringArray(sale.appliedBundleNames),
      materialUsage: normalizeMaterialUsage(sale.materialUsage),
      items: normalizeCartItems(sale.items)
    }));
  } catch {
    return [];
  }
}

export function readRecentSales(limit: number, scopeKey = "default"): LocalSale[] {
  return readLocalSales(scopeKey).slice(0, limit);
}

export function readProducts(defaultProducts: ProductItem[], scopeKey = "default"): ProductItem[] {
  const raw = localStorage.getItem(scopedKey(PRODUCTS_KEY, scopeKey));
  if (!raw) return defaultProducts;
  try {
    const parsed = JSON.parse(raw) as ProductItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultProducts;
    }
    return parsed.map((item) => {
      const baseCost = Math.max(0, Number(item.costPrice || 0));
      const hppProfile = parseProductHppProfile(item.hppProfile, baseCost);
      const effectiveCostPrice = resolveEffectiveCostPrice({
        costPrice: baseCost,
        hppProfile
      });

      return {
        ...item,
        barcode: item.barcode || item.id,
        stock: Math.max(0, Math.round(Number(item.stock || 0))),
        costPrice: effectiveCostPrice,
        hppProfile,
        promoPercent: Math.max(0, Math.min(100, Number(item.promoPercent || 0))),
        imageUrl:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=400&q=80"
      };
    });
  } catch {
    return defaultProducts;
  }
}

export function saveProducts(products: ProductItem[], scopeKey = "default") {
  localStorage.setItem(scopedKey(PRODUCTS_KEY, scopeKey), JSON.stringify(products));
}

export function readCustomers(defaultCustomers: Customer[], scopeKey = "default"): Customer[] {
  const raw = localStorage.getItem(scopedKey(CUSTOMERS_KEY, scopeKey));
  if (!raw) return defaultCustomers;
  try {
    const parsed = JSON.parse(raw) as Customer[];
    if (!Array.isArray(parsed)) return defaultCustomers;
    return parsed;
  } catch {
    return defaultCustomers;
  }
}

export function saveCustomers(customers: Customer[], scopeKey = "default") {
  localStorage.setItem(scopedKey(CUSTOMERS_KEY, scopeKey), JSON.stringify(customers));
}

export function applyStockDeduction(
  products: ProductItem[],
  items: CartItem[]
): ProductItem[] {
  const qtyMap = new Map<string, number>();
  for (const item of items) {
    const current = qtyMap.get(item.id) ?? 0;
    qtyMap.set(item.id, current + item.qty);
  }

  return products.map((product) => {
    const sold = qtyMap.get(product.id) ?? 0;
    if (sold <= 0) return product;
    return {
      ...product,
      stock: Math.max(0, product.stock - sold)
    };
  });
}

export function applyStockReturn(products: ProductItem[], items: CartItem[]): ProductItem[] {
  const qtyMap = new Map<string, number>();
  for (const item of items) {
    const current = qtyMap.get(item.id) ?? 0;
    qtyMap.set(item.id, current + item.qty);
  }

  return products.map((product) => {
    const returned = qtyMap.get(product.id) ?? 0;
    if (returned <= 0) return product;
    return {
      ...product,
      stock: Math.max(0, product.stock + returned)
    };
  });
}

export function readSaleById(saleId: string, scopeKey = "default"): LocalSale | null {
  return readLocalSales(scopeKey).find((sale) => sale.id === saleId) ?? null;
}

export function updateLocalSaleStatus(
  saleId: string,
  status: TransactionStatus,
  scopeKey = "default",
  meta?: { approvalRequestId?: string; approvedBy?: string }
): LocalSale {
  const current = readLocalSales(scopeKey);
  const index = current.findIndex((sale) => sale.id === saleId);

  if (index < 0) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  const updated: LocalSale = {
    ...current[index],
    status,
    approvalRequestId: meta?.approvalRequestId ?? current[index].approvalRequestId,
    approvedBy: meta?.approvedBy ?? current[index].approvedBy
  };

  current[index] = updated;
  localStorage.setItem(scopedKey(STORAGE_KEY, scopeKey), JSON.stringify(current));
  return updated;
}
