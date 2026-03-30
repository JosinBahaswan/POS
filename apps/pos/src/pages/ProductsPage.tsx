import { ProductManager } from "../components/ProductManager";
import type { ProductItem } from "../localData";

type ProductsPageProps = {
  products: ProductItem[];
  onUpsert: (product: ProductItem) => void;
  onDelete: (id: string) => void;
  canDeleteProduct: boolean;
  canAdjustStock: boolean;
};

export function ProductsPage({
  products,
  onUpsert,
  onDelete,
  canDeleteProduct,
  canAdjustStock
}: ProductsPageProps) {
  return (
    <section className="mt-4">
      <ProductManager
        products={products}
        onUpsert={onUpsert}
        onDelete={onDelete}
        canDeleteProduct={canDeleteProduct}
        canAdjustStock={canAdjustStock}
      />
    </section>
  );
}
