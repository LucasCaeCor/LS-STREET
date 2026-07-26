import type {
  OrderStatus,
} from "@prisma/client";

import type {
  AdminDashboardQuery,
} from "./admin-dashboard.schema";

import {
  AdminDashboardRepository,
} from "./admin-dashboard.repository";

const orderStatuses: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_IN_REVIEW",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export class AdminDashboardService {
  constructor(
    private readonly repository:
      AdminDashboardRepository,
  ) {}

  async getSummary(
    query: AdminDashboardQuery,
  ) {
    const startDate = new Date();

    startDate.setUTCDate(
      startDate.getUTCDate() -
        query.days +
        1,
    );

    startDate.setUTCHours(
      0,
      0,
      0,
      0,
    );

    const result =
      await this.repository
        .getDashboardData(
          startDate,
        );

    const ordersByStatus =
      orderStatuses.reduce<
        Record<OrderStatus, number>
      >(
        (statuses, status) => {
          statuses[status] = 0;

          return statuses;
        },
        {} as Record<
          OrderStatus,
          number
        >,
      );

    for (
      const statusResult
      of result.ordersByStatus
    ) {
      ordersByStatus[
        statusResult.status
      ] =
        statusResult._count._all;
    }

    const salesByDate =
      new Map<
        string,
        {
          orders: number;
          revenueInCents: number;
        }
      >();

    for (
      let index = 0;
      index < query.days;
      index += 1
    ) {
      const date =
        new Date(startDate);

      date.setUTCDate(
        startDate.getUTCDate() +
          index,
      );

      const dateKey =
        date
          .toISOString()
          .slice(0, 10);

      salesByDate.set(
        dateKey,
        {
          orders: 0,
          revenueInCents: 0,
        },
      );
    }

    for (
      const order
      of result.periodOrders
    ) {
      const dateKey =
        order.createdAt
          .toISOString()
          .slice(0, 10);

      const current =
        salesByDate.get(dateKey);

      if (!current) {
        continue;
      }

      current.orders += 1;

      current.revenueInCents +=
        order.totalInCents;
    }

    return {
      period: {
        days: query.days,
        startDate,
        endDate: new Date(),
      },

      metrics: {
        totalOrders:
          result.totalOrders,

        pendingPaymentOrders:
          result
            .pendingPaymentOrders,

        activeCustomers:
          result.activeCustomers,

        activeProducts:
          result.activeProducts,

        totalRevenueInCents:
          result
            .totalRevenueInCents,

        periodRevenueInCents:
          result
            .periodRevenueInCents,

        periodOrdersCount:
          result
            .periodOrdersCount,

        lowStockCount:
          result
            .lowStockVariants
            .length,
      },

      ordersByStatus,

      salesChart:
        Array.from(
          salesByDate.entries(),
        ).map(
          ([date, data]) => ({
            date,
            ...data,
          }),
        ),

      recentOrders:
        result.recentOrders.map(
          (order) => ({
            number: order.number,
            status: order.status,

            customerName:
              order.customerName,

            totalInCents:
              order.totalInCents,

            createdAt:
              order.createdAt,

            preview:
              order.items[0]
                ? {
                    productName:
                      order.items[0]
                        .productName,

                    imageUrl:
                      order.items[0]
                        .imageUrl,
                  }
                : null,

            payment:
              order.payments[0] ??
              null,
          }),
        ),

      lowStockVariants:
        result
          .lowStockVariants
          .map((variant) => ({
            id: variant.publicId,

            sku: variant.sku,
            color: variant.color,
            size: variant.size,

            stock:
              variant.stock,

            reservedStock:
              variant.reservedStock,

            availableStock:
              Math.max(
                0,
                variant.stock -
                  variant
                    .reservedStock,
              ),

            lowStockThreshold:
              variant
                .lowStockThreshold,

            product: {
              id:
                variant.product
                  .publicId,

              name:
                variant.product.name,

              slug:
                variant.product.slug,

              imageUrl:
                variant.product
                  .images[0]
                  ?.url ?? null,
            },
          })),
    };
  }
}