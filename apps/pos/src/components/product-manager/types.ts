import type { ProductCategory } from "../../localData";

export type ProductManagerFormState = {
  id: string;
  barcode: string;
  name: string;
  price: number;
  costPrice: number;
  promoPercent: number;
  stock: number;
  category: ProductCategory;
  imageUrl: string;
};

export const productManagerInitialState: ProductManagerFormState = {
  id: "",
  barcode: "",
  name: "",
  price: 0,
  costPrice: 0,
  promoPercent: 0,
  stock: 0,
  category: "drink",
  imageUrl: ""
};

export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=400&q=80";

export const normalizeCategoryLabel = (value: string) => {
  if (!value.trim()) return "Tanpa Kategori";

  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};
