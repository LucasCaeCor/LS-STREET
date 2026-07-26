import type {
  CategoryPagination,
} from "./categories";

import type {
  ProductStatus,
} from "./products";

export type InventoryMovementType =
  | "INITIAL"
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "CANCELLATION";

export interface InventoryVariantOverview {
  variantId: string;

  productId: string;
  productName: string;
  productSlug: string;
  productStatus: ProductStatus;

  imageUrl: string | null;

  sku: string;
  color: string | null;
  size: string | null;

  stock: number;
  reservedStock: number;
  availableStock: number;

  lowStockThreshold: number;
  isLowStock: boolean;

  isActive: boolean;
}

export interface InventoryMovement {
  id: string;
  publicId: string;

  type: InventoryMovementType;
  quantity: number;

  previousStock: number;
  newStock: number;

  reason: string | null;
  referenceId: string | null;

  createdAt: string;

  variant: {
    publicId: string;

    sku: string;
    color: string | null;
    size: string | null;

    stock: number;
    reservedStock: number;
    availableStock: number;

    lowStockThreshold: number;
    lowStock: boolean;

    product: {
      publicId: string;
      name: string;
      slug: string;
      imageUrl: string | null;
    };
  };
}

export interface InventoryMovementsResponse {
  success: boolean;
  message: string;

  data: InventoryMovement[];

  pagination: CategoryPagination;
}

export interface InventoryAdjustmentResponse {
  success: boolean;
  message: string;

  data: {
    variant: {
      publicId: string;
      sku: string;

      stock: number;
      reservedStock: number;
    };

    availableStock: number;
    lowStock: boolean;

    movement: InventoryMovement;
  };
}