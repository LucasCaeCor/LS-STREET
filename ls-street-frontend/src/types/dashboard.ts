export interface DashboardMetrics {
  totalOrders: number;
  pendingPaymentOrders: number;
  activeCustomers: number;
  activeProducts: number;

  totalRevenueInCents: number;
  periodRevenueInCents: number;
  periodOrdersCount: number;
  lowStockCount: number;
}

export interface DashboardSaleDay {
  date: string;
  orders: number;
  revenueInCents: number;
}

export interface RecentOrder {
  number: number;
  status: string;
  customerName: string;
  totalInCents: number;
  createdAt: string;

  preview: {
    productName: string;
    imageUrl: string | null;
  } | null;

  payment: {
    method: string;
    status: string;
  } | null;
}

export interface LowStockVariant {
  id: string;
  sku: string;
  color: string;
  size: string;

  stock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;

  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  };
}

export interface DashboardData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };

  metrics: DashboardMetrics;

  ordersByStatus:
    Record<string, number>;

  salesChart:
    DashboardSaleDay[];

  recentOrders:
    RecentOrder[];

  lowStockVariants:
    LowStockVariant[];
}

export interface DashboardResponse {
  success: boolean;
  message: string;

  data: {
    dashboard:
      DashboardData;
  };
}