// import type {
//   Pagination,
// } from "./orders";

// export interface FavoriteProductImage {
//   publicId: string;

//   url: string;
//   altText: string | null;

//   isPrimary: boolean;
// }

// export interface FavoriteProductVariant {
//   publicId: string;

//   sku: string;

//   color: string | null;
//   size: string | null;

//   priceInCents: number;

//   compareAtPriceInCents:
//     | number
//     | null;

//   stock: number;
//   reservedStock: number;

//   availableStock: number;
// }

// export interface FavoriteProduct {
//   publicId: string;

//   name: string;
//   slug: string;

//   shortDescription:
//     | string
//     | null;

//   brand: string | null;

//   isFeatured: boolean;

//   image:
//     | FavoriteProductImage
//     | null;

//   category: {
//     publicId: string;

//     name: string;
//     slug: string;
//   };

//   minimumPriceInCents:
//     | number
//     | null;

//   available: boolean;

//   variants:
//     FavoriteProductVariant[];
// }

// export interface FavoriteItem {
//   id: string;
//   createdAt: string;

//   product: FavoriteProduct;
// }

// export interface FavoritesResponse {
//   success: boolean;
//   message: string;

//   data: FavoriteItem[];

//   pagination: Pagination;
// }