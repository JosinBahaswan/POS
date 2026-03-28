import { ProductManager } from "../components/ProductManager";
import type { ProductItem } from "../localData";

type ProductsPageProps = {
  products: ProductItem[];
  onUpsert: (product: ProductItem) => void;
  onDelete: (id: string) => void;
};

export function ProductsPage({ products, onUpsert, onDelete }: ProductsPageProps) {
  return (
    <section className="mt-4">
      <ProductManager products={products} onUpsert={onUpsert} onDelete={onDelete} />
    </section>
  );
}
