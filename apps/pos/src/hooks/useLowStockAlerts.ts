import { useState, useEffect } from "react";
import { ProductItem } from "../localData";

export function useLowStockAlerts(products: ProductItem[]) {
  const [lowStockItems, setLowStockItems] = useState<ProductItem[]>([]);

  useEffect(() => {
    const alertingItems = products.filter(
      (p) => p.stock <= (p.minStockLevel ?? 5)
    );
    setLowStockItems(alertingItems);
  }, [products]);

  return { lowStockItems };
}
