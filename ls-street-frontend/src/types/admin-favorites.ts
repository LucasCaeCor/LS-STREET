import type {
  CustomerStatus,
} from "./customers";

import type {
  Pagination,
} from "./orders";

import type {
  ProductStatus,
} from "./products";

export interface AdminFavoriteImage {
  publicId: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface AdminFavoriteListItem {
  id: string;
  createdAt: string;

  customer: {
    publicId: string;
    name: string;
    email: string;
    status: CustomerStatus;
  };

  product: {
    publicId: string;
    name: string;
    slug: string;
    brand: string | null;
    status: ProductStatus;

    image:
      | AdminFavoriteImage
      | null;
  };
}

export interface AdminFavoriteSummary {
  totalFavorites: number;
  customersWithFavorites: number;
  productsFavorited: number;
  favoritesLastThirtyDays: number;
}

export interface AdminFavoritesResponse {
  success: boolean;
  message: string;

  data: AdminFavoriteListItem[];

  pagination: Pagination;
}

export interface AdminFavoriteSummaryResponse {
  success: boolean;
  message: string;

  data: {
    summary: AdminFavoriteSummary;
  };
}