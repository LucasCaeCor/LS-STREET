import type {
  OrderStatus,
  Pagination,
  PaymentMethod,
  PaymentStatus,
} from "./orders";

export type CustomerStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "BLOCKED";

export interface CustomerCounts {
  orders: number;
  addresses: number;
  favorites: number;
}

export interface CustomerLatestOrder {
  number: number;
  status: OrderStatus;

  totalInCents: number;
  createdAt: string;
}

export interface AdminCustomerListItem {
  id: string;

  name: string;
  email: string;
  phone: string | null;

  avatarUrl: string | null;

  role: "CUSTOMER";
  status: CustomerStatus;

  emailVerified: boolean;
  lastLoginAt: string | null;

  createdAt: string;
  updatedAt: string;

  counts: CustomerCounts;

  latestOrder:
    | CustomerLatestOrder
    | null;
}

export interface CustomerStatistics {
  ordersCount: number;
  completedOrdersCount: number;

  totalSpentInCents: number;
  averageOrderInCents: number;

  addressesCount: number;
  favoritesCount: number;
}

export interface CustomerAddress {
  id: string;

  recipientName: string;
  phone: string;

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

export interface CustomerRecentOrder {
  number: number;
  status: OrderStatus;

  totals: {
    subtotalInCents: number;
    discountInCents: number;
    shippingInCents: number;
    totalInCents: number;
  };

  preview: {
    productName: string;
    imageUrl: string | null;
  } | null;

  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
  } | null;

  paidAt: string | null;
  createdAt: string;
}

export interface AdminCustomerDetails {
  id: string;

  name: string;
  email: string;
  phone: string | null;

  avatarUrl: string | null;

  role: "CUSTOMER";
  status: CustomerStatus;

  emailVerified: boolean;
  lastLoginAt: string | null;

  createdAt: string;
  updatedAt: string;

  statistics: CustomerStatistics;

  addresses: CustomerAddress[];
  recentOrders: CustomerRecentOrder[];
}

export interface CustomerSummary {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  verified: number;
}

export interface CustomersResponse {
  success: boolean;
  message: string;

  data: AdminCustomerListItem[];

  pagination: Pagination;
}

export interface CustomerSummaryResponse {
  success: boolean;
  message: string;

  data: {
    summary: CustomerSummary;
  };
}

export interface CustomerDetailsResponse {
  success: boolean;
  message: string;

  data: {
    customer: AdminCustomerDetails;
  };
}

export interface UpdateCustomerStatusResponse {
  success: boolean;
  message: string;

  data: {
    customer: AdminCustomerListItem;
  };
}