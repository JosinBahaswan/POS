import type { CartItem, PaymentBreakdown, PaymentMethod, TransactionStatus } from "./types";
import type { ProductItem } from "./localData";

export type LocalSale = {
  id: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: PaymentBreakdown;
  shiftId?: string;
  outletId?: string;
  status: TransactionStatus;
  approvalRequestId?: string;
  approvedBy?: string;
  synced: boolean;
  createdAt: string;
  items: CartItem[];
};

const STORAGE_KEY = "pos_local_sales";
const PRODUCTS_KEY = "pos_products";

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
      paymentBreakdown: sale.paymentBreakdown
        ? {
            cash: Number(sale.paymentBreakdown.cash || 0),
            card: Number(sale.paymentBreakdown.card || 0),
            qris: Number(sale.paymentBreakdown.qris || 0)
          }
        : undefined,
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
    return parsed.map((item) => ({
      ...item,
      costPrice: Math.max(0, Number(item.costPrice || 0)),
      promoPercent: Math.max(0, Math.min(100, Number(item.promoPercent || 0))),
      imageUrl:
        item.imageUrl ||
        "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=400&q=80"
    }));
  } catch {
    return defaultProducts;
  }
}

export function saveProducts(products: ProductItem[], scopeKey = "default") {
  localStorage.setItem(scopedKey(PRODUCTS_KEY, scopeKey), JSON.stringify(products));
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
