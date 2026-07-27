export interface StoreCartImage {
  publicId: string;

  url: string;
  altText: string | null;

  isPrimary: boolean;
}

export interface StoreCartVariant {
  id: string;
  sku: string;

  color: string | null;
  size: string | null;

  priceInCents: number;

  compareAtPriceInCents:
    | number
    | null;
}

export interface StoreCartProduct {
  id: string;
  name: string;
  slug: string;

  image:
    | StoreCartImage
    | null;
}

export interface StoreCartItem {
  id: string;

  quantity: number;

  unitPriceInCents: number;
  totalInCents: number;

  availableStock: number;
  isAvailable: boolean;

  variant: StoreCartVariant;
  product: StoreCartProduct;

  createdAt: string;
  updatedAt: string;
}

export interface StoreCartSummary {
  uniqueItems: number;
  totalQuantity: number;
  subtotalInCents: number;
}

export interface StoreCart {
  items: StoreCartItem[];

  summary: StoreCartSummary;

  createdAt: string;
  updatedAt: string;
}

export interface StoreCartResponse {
  success: boolean;
  message?: string;

  data: StoreCart;
}