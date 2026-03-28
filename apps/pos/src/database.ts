import type { CartItem, PaymentMethod } from "./types";
import type { ProductItem } from "./localData";

export type LocalSale = {
  id: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  synced: boolean;
  createdAt: string;
  items: CartItem[];
};

const STORAGE_KEY = "pos_local_sales";
const PRODUCTS_KEY = "pos_products";

function scopedKey(baseKey: string, scopeKey: string) {
  return `${baseKey}:${scopeKey}`;
}

export function saveLocalSale(sale: Omit<LocalSale, "synced">, scopeKey = "default") {
  const current = readLocalSales(scopeKey);
  const next = [{ ...sale, synced: false }, ...current];
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
    return JSON.parse(raw) as LocalSale[];
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
