import type {
  Gateway,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

export interface ListAdminPaymentsFilters {
  page: number;
  limit: number;

  search?: string;

  status?: PaymentStatus;
  method?: PaymentMethod;
  gateway?: Gateway;

  startDate?: Date;
  endDate?: Date;

  sortOrder: "asc" | "desc";
}

const adminPaymentSelect = {
  id: true,

  gateway: true,
  method: true,
  status: true,

  amountInCents: true,
  installments: true,

  gatewayOrderId: true,
  gatewayPaymentId: true,
  gatewayPreferenceId: true,

  externalReference: true,
  rawStatus: true,

  ticketUrl: true,
  expiresAt: true,

  approvedAt: true,
  cancelledAt: true,
  refundedAt: true,

  createdAt: true,
  updatedAt: true,

  order: {
    select: {
      number: true,
      status: true,

      subtotalInCents: true,
      discountInCents: true,
      shippingInCents: true,
      totalInCents: true,

      customerName: true,
      customerEmail: true,
      customerPhone: true,

      paidAt: true,
      createdAt: true,

      items: {
        select: {
          productName: true,
          variantName: true,
          sku: true,
          imageUrl: true,
          unitPriceInCents: true,
          quantity: true,
          totalInCents: true,
        },
      },
    },
  },
} as const;

export class AdminPaymentRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async list(
    filters:
      ListAdminPaymentsFilters,
  ) {
    const where:
      Prisma.PaymentWhereInput = {};

    if (filters.status) {
      where.status =
        filters.status;
    }

    if (filters.method) {
      where.method =
        filters.method;
    }

    if (filters.gateway) {
      where.gateway =
        filters.gateway;
    }

    if (
      filters.startDate ||
      filters.endDate
    ) {
      where.createdAt = {
        ...(filters.startDate
          ? {
              gte:
                filters.startDate,
            }
          : {}),

        ...(filters.endDate
          ? {
              lte:
                filters.endDate,
            }
          : {}),
      };
    }

    if (filters.search) {
      const search =
        filters.search;

      const possibleOrderNumber =
        Number(search);

      const searchConditions:
        Prisma.PaymentWhereInput[] =
        [
          {
            gatewayPaymentId: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            gatewayOrderId: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            externalReference: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            order: {
              customerName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },

          {
            order: {
              customerEmail: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ];

      if (
        Number.isInteger(
          possibleOrderNumber,
        ) &&
        possibleOrderNumber > 0
      ) {
        searchConditions.push({
          order: {
            number:
              possibleOrderNumber,
          },
        });
      }

      where.OR =
        searchConditions;
    }

    const skip =
      (filters.page - 1) *
      filters.limit;

    const [
      payments,
      totalItems,
    ] =
      await this.prisma
        .$transaction([
          this.prisma.payment
            .findMany({
              where,

              skip,
              take:
                filters.limit,

              orderBy: {
                createdAt:
                  filters.sortOrder,
              },

              select:
                adminPaymentSelect,
            }),

          this.prisma.payment
            .count({
              where,
            }),
        ]);

    return {
      payments,
      totalItems,
    };
  }

  async findById(
    paymentId: string,
  ) {
    return this.prisma.payment
      .findUnique({
        where: {
          id: paymentId,
        },

        select:
          adminPaymentSelect,
      });
  }

  async getSummary() {
    const [
      total,
      pending,
      inProcess,
      approved,
      rejected,
      cancelled,
      refunded,
      chargedBack,
      approvedAmount,
    ] = await Promise.all([
      this.prisma.payment.count(),

      this.prisma.payment.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.payment.count({
        where: {
          status: "IN_PROCESS",
        },
      }),

      this.prisma.payment.count({
        where: {
          status: "APPROVED",
        },
      }),

      this.prisma.payment.count({
        where: {
          status: "REJECTED",
        },
      }),

      this.prisma.payment.count({
        where: {
          status: "CANCELLED",
        },
      }),

      this.prisma.payment.count({
        where: {
          status: "REFUNDED",
        },
      }),

      this.prisma.payment.count({
        where: {
          status:
            "CHARGED_BACK",
        },
      }),

      this.prisma.payment.aggregate({
        where: {
          status: "APPROVED",
        },

        _sum: {
          amountInCents: true,
        },
      }),
    ]);

    return {
      total,
      pending,
      inProcess,
      approved,
      rejected,
      cancelled,
      refunded,
      chargedBack,

      approvedAmountInCents:
        approvedAmount._sum
          .amountInCents ?? 0,
    };
  }
}