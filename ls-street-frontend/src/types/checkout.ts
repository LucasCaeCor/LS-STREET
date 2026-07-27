import type {
  StoreCartItem,
} from "./cart";

export interface CheckoutAddress {
  id: string;
  publicId: string;

  recipientName: string;
  phone: string | null;

  zipCode: string;
  street: string;
  number: string;

  complement: string | null;
  neighborhood: string;

  city: string;
  state: string;
  country: string;

  label: string | null;
  isDefault: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  recipientName: string;
  phone?: string | null;

  zipCode: string;
  street: string;
  number: string;

  complement?: string | null;
  neighborhood: string;

  city: string;
  state: string;
  country: string;

  label?: string | null;
  isDefault?: boolean;
}

export interface AddressesResponse {
  success: boolean;

  data: {
    addresses: CheckoutAddress[];
  };
}

export interface AddressResponse {
  success: boolean;
  message: string;

  data: {
    address: CheckoutAddress;
  };
}

export type CheckoutCouponType =
  | "PERCENTAGE"
  | "FIXED"
  | "FREE_SHIPPING";

export interface ValidatedCoupon {
  valid: true;

  coupon: {
    id: string;
    code: string;

    description:
      | string
      | null;

    type:
      CheckoutCouponType;

    value: number;
  };

  subtotalInCents: number;
  discountInCents: number;

  totalAfterDiscountInCents:
    number;

  freeShipping: boolean;
}

export interface ValidateCouponResponse {
  success: boolean;
  message: string;

  data: ValidatedCoupon;
}

export interface CheckoutOrderItem {
  id: string;

  productName: string;
  variantName: string | null;

  sku: string;
  imageUrl: string | null;

  unitPriceInCents: number;
  quantity: number;
  totalInCents: number;
}

export interface CheckoutOrder {
  id: string;
  number: number;

  status: string;

  subtotalInCents: number;
  discountInCents: number;
  shippingInCents: number;
  totalInCents: number;

  couponCode: string | null;

  customerName: string;
  customerEmail: string;
  customerPhone: string | null;

  recipient: string;

  shippingZipCode: string;
  shippingStreet: string;
  shippingNumber: string;

  shippingComplement:
    | string
    | null;

  shippingDistrict: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;

  items: CheckoutOrderItem[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckoutResponse {
  success: boolean;
  message: string;

  data: {
    order: CheckoutOrder;
  };
}

export type CheckoutPaymentStatus =
  | "PENDING"
  | "IN_PROCESS"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED"
  | "CHARGED_BACK";

export interface CheckoutPayment {
  id: string;

  gateway: "MERCADO_PAGO";
  method: "PIX";

  status:
    CheckoutPaymentStatus;

  amountInCents: number;

  installments: number | null;

  gatewayOrderId:
    | string
    | null;

  gatewayPaymentId:
    | string
    | null;

  gatewayPreferenceId:
    | string
    | null;

  externalReference:
    | string
    | null;

  rawStatus: string | null;

  ticketUrl: string | null;

  pixQrCode: string | null;

  pixQrCodeBase64:
    | string
    | null;

  expiresAt: string | null;

  approvedAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  message: string;

  data: {
    payment: CheckoutPayment;
    reused: boolean;
  };
}

export interface LatestPaymentResponse {
  success: boolean;
  message: string;

  data: {
    payment:
      | CheckoutPayment
      | null;
  };
}

export interface CheckoutCartSnapshot {
  items: StoreCartItem[];

  subtotalInCents: number;
}