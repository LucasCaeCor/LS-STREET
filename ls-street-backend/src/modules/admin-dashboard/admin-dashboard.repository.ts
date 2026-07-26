import type {
  OrderStatus,
  PrismaClient,
} from "@prisma/client";

const revenueOrderStatuses: OrderStatus[] = [
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

export class AdminDashboardRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async getDashboardData(
    startDate: Date,
  ) {
    const [
      totalOrders,
      pendingPaymentOrders,
      activeCustomers,
      activeProducts,
      totalRevenue,
      periodRevenue,
      ordersByStatus,
      periodOrders,
      recentOrders,
      variants,
    ] = await Promise.all([
      this.prisma.order.count(),

      this.prisma.order.count({
        where: {
          status: "PENDING_PAYMENT",
        },
      }),

      this.prisma.user.count({
        where: {
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      }),

      this.prisma.product.count({
        where: {
          status: "ACTIVE",
        },
      }),

      this.prisma.order.aggregate({
        where: {
          status: {
            in: revenueOrderStatuses,
          },
        },

        _sum: {
          totalInCents: true,
        },
      }),

      this.prisma.order.aggregate({
        where: {
          status: {
            in: revenueOrderStatuses,
          },

          createdAt: {
            gte: startDate,
          },
        },

        _sum: {
          totalInCents: true,
        },

        _count: {
          _all: true,
        },
      }),

      this.prisma.order.groupBy({
        by: ["status"],

        _count: {
          _all: true,
        },
      }),

      this.prisma.order.findMany({
        where: {
          status: {
            in: revenueOrderStatuses,
          },

          createdAt: {
            gte: startDate,
          },
        },

        select: {
          createdAt: true,
          totalInCents: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      }),

      this.prisma.order.findMany({
        take: 8,

        orderBy: {
          createdAt: "desc",
        },

        select: {
          number: true,
          status: true,
          customerName: true,
          totalInCents: true,
          createdAt: true,

          items: {
            take: 1,

            select: {
              productName: true,
              imageUrl: true,
            },
          },

          payments: {
            take: 1,

            orderBy: {
              createdAt: "desc",
            },

            select: {
              method: true,
              status: true,
            },
          },
        },
      }),

      this.prisma.productVariant.findMany({
        where: {
          isActive: true,
        },

        select: {
          id: true,
          publicId: true,
          sku: true,
          color: true,
          size: true,
          stock: true,
          reservedStock: true,
          lowStockThreshold: true,

          product: {
            select: {
              id: true,
              publicId: true,
              name: true,
              slug: true,

              images: {
                where: {
                  isPrimary: true,
                },

                take: 1,

                select: {
                  url: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const lowStockVariants =
      variants
        .filter(
          (variant) =>
            variant.stock <=
            variant.lowStockThreshold,
        )
        .sort(
          (first, second) =>
            first.stock - second.stock,
        )
        .slice(0, 10);

    return {
      totalOrders,
      pendingPaymentOrders,
      activeCustomers,
      activeProducts,

      totalRevenueInCents:
        totalRevenue._sum
          .totalInCents ?? 0,

      periodRevenueInCents:
        periodRevenue._sum
          .totalInCents ?? 0,

      periodOrdersCount:
        periodRevenue._count._all,

      ordersByStatus,
      periodOrders,
      recentOrders,
      lowStockVariants,
    };
  }
}