import type {
  CategoryPagination,
} from "./categories";

import type {
  ProductStatus,
} from "./products";

export interface ManagedProductVariant {
  id: string;

  product: {
    id: string;
    name: string;
    slug: string;
    status: ProductStatus;
  };

  sku: string;

  color: string | null;
  size: string | null;

  priceInCents: number;
  compareAtPriceInCents:
    | number
    | null;

  costInCents: number | null;

  stock: number;
  reservedStock: number;
  availableStock: number;

  lowStockThreshold: number;
  isLowStock: boolean;

  barcode: string | null;

  weightInGrams: number | null;

  dimensions: {
    height: number | null;
    width: number | null;
    length: number | null;
  };

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantsResponse {
  success: boolean;
  message: string;

  data: ManagedProductVariant[];

  pagination: CategoryPagination;
}

export interface ProductVariantResponse {
  success: boolean;
  message: string;

  data: {
    variant:
      ManagedProductVariant;
  };
}