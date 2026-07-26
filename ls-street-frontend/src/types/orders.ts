export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_IN_REVIEW"
  | "PAID"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "IN_PROCESS"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED"
  | "CHARGED_BACK";

export type PaymentMethod =
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BOLETO"
  | "OTHER";

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminOrderListItem {
  number: number;
  status: OrderStatus;

  customer: {
    name: string;
    email: string;
    phone: string | null;
  };

  itemsCount: number;

  preview: {
    productName: string;
    imageUrl: string | null;
  } | null;

  payment: {
    gateway: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amountInCents: number;
    createdAt: string;
  } | null;

  totals: {
    subtotalInCents: number;
    discountInCents: number;
    shippingInCents: number;
    totalInCents: number;
  };

  trackingCode: string | null;

  dates: {
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    cancelledAt: string | null;
  };
}

export interface AdminOrderItem {
  productName: string;
  variantName: string | null;
  sku: string;
  imageUrl: string | null;
  unitPriceInCents: number;
  quantity: number;
  totalInCents: number;
}

export interface AdminOrderPayment {
  gateway: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountInCents: number;
  installments: number | null;
  approvedAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderDetails {
  number: number;
  status: OrderStatus;

  customer: {
    name: string;
    email: string;
    phone: string | null;
  };

  shippingAddress: {
    recipient: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    state: string;
    country: string;
  };

  shipping: {
    trackingCode: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };

  coupon: {
    code: string;
  } | null;

  totals: {
    subtotalInCents: number;
    discountInCents: number;
    shippingInCents: number;
    totalInCents: number;
  };

  items: AdminOrderItem[];
  payments: AdminOrderPayment[];

  dates: {
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    cancelledAt: string | null;
  };
}

export interface AdminOrdersResponse {
  success: boolean;
  message: string;
  data: AdminOrderListItem[];
  pagination: Pagination;
}

export interface AdminOrderDetailsResponse {
  success: boolean;
  message: string;

  data: {
    order: AdminOrderDetails;
  };
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message: string;

  data: {
    order: {
      number: number;
      status: OrderStatus;
      trackingCode: string | null;
      trackingUrl: string | null;
      paidAt: string | null;
      shippedAt: string | null;
      deliveredAt: string | null;
      cancelledAt: string | null;
      updatedAt: string;
    };
  };
}