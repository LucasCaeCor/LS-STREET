import type {
  Pagination,
} from "./orders";

export type StoreBannerPosition =
  | "HOME_HERO"
  | "HOME_MIDDLE"
  | "CATEGORY"
  | "PROMOTION";

export interface StoreBanner {
  id: string;

  title: string;
  subtitle: string | null;

  imageUrl: string;
  mobileImageUrl: string | null;

  link: string | null;
  buttonText: string | null;

  position: StoreBannerPosition;
  sortOrder: number;

  active: boolean;

  startsAt: string | null;
  endsAt: string | null;
}

export interface StoreCategory {
  id: string;

  name: string;
  slug: string;

  description: string | null;
  imageUrl: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface StoreProductImage {
  id: string;
  publicId: string;

  url: string;
  altText: string | null;

  position: number;
  isPrimary: boolean;
}

export interface StoreProductVariant {
  id: string;
  publicId: string;

  sku: string;

  color: string | null;
  size: string | null;

  priceInCents: number;

  compareAtPriceInCents:
    | number
    | null;

  stock: number;
  reservedStock: number;

  lowStockThreshold: number;

  isActive: boolean;
}

export interface StoreProduct {
  id: string;
  publicId: string;

  name: string;
  slug: string;

  description: string | null;
  shortDescription: string | null;

  brand: string | null;

  status: "ACTIVE";
  isFeatured: boolean;

  category: {
    id: string;
    publicId: string;

    name: string;
    slug: string;
  };

  images: StoreProductImage[];
  variants: StoreProductVariant[];

  createdAt: string;
  updatedAt: string;
}

export interface PublicBannersResponse {
  success: boolean;
  message: string;

  data: {
    banners: StoreBanner[];
  };
}

export interface PublicCategoriesResponse {
  success: boolean;
  message: string;

  data: StoreCategory[];

  pagination: Pagination;
}

export interface PublicProductsResponse {
  success: boolean;
  message: string;

  data: StoreProduct[];

  pagination: Pagination;
}

export interface PublicProductResponse {
  success: boolean;
  message: string;

  data: {
    product: StoreProduct;
  };
}