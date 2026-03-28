export type ProductCategory = "drink" | "food";

export type ProductItem = {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: ProductCategory;
  favorite: boolean;
  imageUrl: string;
};

export const products: ProductItem[] = [
  {
    id: "PRD-001",
    barcode: "899700100001",
    name: "Americano",
    price: 18000,
    stock: 30,
    category: "drink",
    favorite: true,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "PRD-002",
    barcode: "899700100002",
    name: "Cappuccino",
    price: 22000,
    stock: 24,
    category: "drink",
    favorite: true,
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "PRD-003",
    barcode: "899700100003",
    name: "Croissant",
    price: 15000,
    stock: 12,
    category: "food",
    favorite: false,
    imageUrl: "https://images.unsplash.com/photo-1555507036-ab794f4ade1b?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "PRD-004",
    barcode: "899700100004",
    name: "Mineral Water",
    price: 7000,
    stock: 42,
    category: "drink",
    favorite: false,
    imageUrl: "https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=400&q=80"
  }
];
