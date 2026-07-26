import type {
  OrderStatus,
  Pagination,
  PaymentMethod,
  PaymentStatus,
} from "./orders";

export type PaymentGateway =
  "MERCADO_PAGO";

export interface AdminPaymentItem {
  productName: string;
  variantName: string | null;

  sku: string;
  imageUrl: string | null;

  unitPriceInCents: number;
  quantity: number;
  totalInCents: number;
}

export interface AdminPaymentOrder {
  number: number;
  status: OrderStatus;

  subtotalInCents: number;
  discountInCents: number;
  shippingInCents: number;
  totalInCents: number;

  customerName: string;
  customerEmail: string;
  customerPhone: string | null;

  paidAt: string | null;
  createdAt: string;

  items: AdminPaymentItem[];
}

export interface AdminPayment {
  id: string;

  gateway: PaymentGateway;
  method: PaymentMethod;
  status: PaymentStatus;

  amountInCents: number;
  installments: number | null;

  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  gatewayPreferenceId: string | null;

  externalReference: string | null;
  rawStatus: string | null;

  ticketUrl: string | null;
  expiresAt: string | null;

  approvedAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;

  createdAt: string;
  updatedAt: string;

  order: AdminPaymentOrder;
}

export interface PaymentSummary {
  total: number;

  pending: number;
  inProcess: number;
  approved: number;

  rejected: number;
  cancelled: number;
  refunded: number;
  chargedBack: number;

  approvedAmountInCents: number;
}

export interface AdminPaymentsResponse {
  success: boolean;
  message: string;

  data: AdminPayment[];

  pagination: Pagination;
}

export interface AdminPaymentResponse {
  success: boolean;
  message: string;

  data: {
    payment: AdminPayment;
  };
}

export interface PaymentSummaryResponse {
  success: boolean;
  message: string;

  data: {
    summary: PaymentSummary;
  };
}