import type {
  Pagination,
} from "./orders";

export type BannerPosition =
  | "HOME_HERO"
  | "HOME_MIDDLE"
  | "CATEGORY"
  | "PROMOTION";

export interface Banner {
  id: string;

  title: string;
  subtitle: string | null;

  imageUrl: string;
  mobileImageUrl: string | null;

  publicId: string | null;
  mobilePublicId: string | null;

  link: string | null;
  buttonText: string | null;

  position: BannerPosition;
  sortOrder: number;

  active: boolean;

  startsAt: string | null;
  endsAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface BannersResponse {
  success: boolean;
  message: string;

  data: Banner[];

  pagination: Pagination;
}

export interface BannerResponse {
  success: boolean;
  message: string;

  data: {
    banner: Banner;
  };
}

export interface BannerUploadResponse {
  success: boolean;
  message: string;

  data: {
    url: string;
    publicId: string;
  };
}