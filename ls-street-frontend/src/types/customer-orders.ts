import type {
  AdminOrderDetails,
  OrderStatus,
  Pagination,
  PaymentMethod,
  PaymentStatus,
} from "./orders";

export interface CustomerOrderListItem {
  number: number;
  status: OrderStatus;

  itemsCount: number;

  preview: {
    productName: string;
    imageUrl: string | null;
  } | null;

  payment: {
    gateway: string;
    method: PaymentMethod;
    status: PaymentStatus;
  } | null;

  totals: {
    subtotalInCents: number;
    discountInCents: number;
    shippingInCents: number;
    totalInCents: number;
  };

  createdAt: string;
  updatedAt: string;
}

export type CustomerOrderDetails =
  AdminOrderDetails;

export interface CustomerOrdersResponse {
  success: boolean;
  message: string;

  data: CustomerOrderListItem[];

  pagination: Pagination;
}

export interface CustomerOrderDetailsResponse {
  success: boolean;
  message: string;

  data: {
    order: CustomerOrderDetails;
  };
}