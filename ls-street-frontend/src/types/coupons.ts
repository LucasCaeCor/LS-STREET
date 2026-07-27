import type {
  Pagination,
} from "./orders";

export type CouponType =
  | "PERCENTAGE"
  | "FIXED"
  | "FREE_SHIPPING";

export interface Coupon {
  id: string;

  code: string;
  description: string | null;

  type: CouponType;
  value: number;

  minimumOrderInCents: number;
  maximumDiscountInCents:
    | number
    | null;

  usageLimit: number | null;
  usageCount: number;

  usageLimitPerUser:
    | number
    | null;

  startsAt: string | null;
  expiresAt: string | null;

  active: boolean;

  createdAt: string;
  updatedAt: string;

  _count: {
    orders: number;
  };
}

export interface CouponsResponse {
  success: boolean;
  message: string;

  data: Coupon[];

  pagination: Pagination;
}

export interface CouponResponse {
  success: boolean;
  message: string;

  data: {
    coupon: Coupon;
  };
}