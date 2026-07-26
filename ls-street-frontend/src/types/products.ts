import type {
  CategoryPagination,
} from "./categories";

export type ProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export interface ProductCategory {
  id: string;
  publicId: string;

  name: string;
  slug: string;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  publicId: string;

  url: string;
  altText: string | null;

  position: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  publicId: string;

  sku: string;
  color: string;
  size: string;

  priceInCents: number;
  compareAtPriceInCents: number | null;

  stock: number;
  reservedStock: number;
  lowStockThreshold: number;

  isActive: boolean;
}

export interface Product {
  id: string;
  publicId: string;

  name: string;
  slug: string;

  description: string | null;
  shortDescription: string | null;
  brand: string | null;

  status: ProductStatus;
  isFeatured: boolean;

  seoTitle: string | null;
  seoDescription: string | null;

  categoryId: string;
  category: ProductCategory;

  images: ProductImage[];
  variants: ProductVariant[];

  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  message: string;

  data: Product[];

  pagination:
    CategoryPagination;
}

export interface ProductResponse {
  success: boolean;
  message: string;

  data: {
    product: Product;
  };
}