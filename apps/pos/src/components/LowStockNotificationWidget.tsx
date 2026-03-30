import { useState } from "react";
import type { ProductItem } from "../localData";

interface Props {
  lowStockItems: ProductItem[];
}

export function LowStockNotificationWidget({ lowStockItems }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (lowStockItems.length === 0) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-error-container text-on-error-container rounded-full hover:brightness-95 transition-colors relative flex items-center justify-center"
        title={`${lowStockItems.length} products with low stock`}
      >
        <span className="material-symbols-outlined text-[20px]">warning</span>
        <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
          {lowStockItems.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface rounded-xl shadow-lg border border-outline-variant/30 z-50 overflow-hidden">
          <div className="bg-error-container/20 p-3 flex justify-between items-center border-b border-outline-variant/30">
            <h3 className="font-semibold text-error flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Peringatan Stok Tipis
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {lowStockItems.map((item) => (
              <div key={item.id} className="p-3 border-b border-outline-variant/10 last:border-0 text-sm hover:bg-surface-container-highest transition flex justify-between items-center">
                <div>
                  <div className="font-medium text-on-surface">{item.name}</div>
                  <div className="text-on-surface-variant text-xs">SKU: {item.barcode}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-error">{item.stock} sisa</div>
                  <div className="text-on-surface-variant text-xs">Min: {item.minStockLevel || 5}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 bg-surface-container-lowest text-center text-[11px] text-on-surface-variant border-t border-outline-variant/30">
            Segera restock untuk menghindari kehabisan barang.
          </div>
        </div>
      )}
    </div>
  );
}
