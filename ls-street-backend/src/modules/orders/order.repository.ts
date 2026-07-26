import type {
  OrderStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import type {
  ListAdminOrdersQuery,
  UpdateOrderStatusBody,
} from "./order.schema";

const orderListSelect = {
  number: true,
  status: true,
  subtotalInCents: true,
  discountInCents: true,
  shippingInCents: true,
  totalInCents: true,
  createdAt: true,
  updatedAt: true,

  items: {
    select: {
      quantity: true,
      imageUrl: true,
      productName: true,
    },
  },

  payments: {
    orderBy: {
      createdAt: "desc",
    },

    take: 1,

    select: {
      gateway: true,
      method: true,
      status: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

const adminOrderListSelect = {
  number: true,
  status: true,

  customerName: true,
  customerEmail: true,
  customerPhone: true,

  subtotalInCents: true,
  discountInCents: true,
  shippingInCents: true,
  totalInCents: true,

  trackingCode: true,

  paidAt: true,
  shippedAt: true,
  deliveredAt: true,
  cancelledAt: true,

  createdAt: true,
  updatedAt: true,

  items: {
    select: {
      productName: true,
      imageUrl: true,
      quantity: true,
    },
  },

  payments: {
    orderBy: {
      createdAt: "desc",
    },

    take: 1,

    select: {
      gateway: true,
      method: true,
      status: true,
      amountInCents: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

const orderDetailsSelect = {
  number: true,
  status: true,

  subtotalInCents: true,
  discountInCents: true,
  shippingInCents: true,
  totalInCents: true,
  couponCode: true,

  customerName: true,
  customerEmail: true,
  customerPhone: true,

  recipient: true,
  shippingZipCode: true,
  shippingStreet: true,
  shippingNumber: true,
  shippingComplement: true,
  shippingDistrict: true,
  shippingCity: true,
  shippingState: true,
  shippingCountry: true,

  trackingCode: true,
  trackingUrl: true,

  paidAt: true,
  shippedAt: true,
  deliveredAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,

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

  payments: {
    orderBy: {
      createdAt: "desc",
    },

    select: {
      gateway: true,
      method: true,
      status: true,
      amountInCents: true,
      installments: true,
      approvedAt: true,
      cancelledAt: true,
      refundedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

export class OrderRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findAllAdmin(query: ListAdminOrdersQuery) {
  const {
    page,
    limit,
    status,
    number,
    customer,
    from,
    to,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  const createdAt =
    from || to
      ? {
          ...(from && {
            gte: from,
          }),

          ...(to && {
            lte: new Date(
              to.getFullYear(),
              to.getMonth(),
              to.getDate(),
              23,
              59,
              59,
              999,
            ),
          }),
        }
      : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(status && {
      status,
    }),

    ...(number && {
      number,
    }),

    ...(createdAt && {
      createdAt,
    }),

    ...(customer && {
      OR: [
        {
          customerName: {
            contains: customer,
            mode: "insensitive",
          },
        },

        {
          customerEmail: {
            contains: customer,
            mode: "insensitive",
          },
        },

        {
          customerPhone: {
            contains: customer,
          },
        },
      ],
    }),
  };

  const [orders, totalItems] =
    await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,

        select: adminOrderListSelect,

        orderBy: {
          createdAt: sortOrder,
        },

        skip,
        take: limit,
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

  return {
    orders,
    totalItems,
  };
}

async findAdminByNumber(number: number) {
  return this.prisma.order.findUnique({
    where: {
      number,
    },

    select: orderDetailsSelect,
  });
}

async findStatusByNumber(number: number) {
  return this.prisma.order.findUnique({
    where: {
      number,
    },

    select: {
      number: true,
      status: true,
      paidAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
      trackingCode: true,
      trackingUrl: true,
    },
  });
}

async updateStatus(
  number: number,
  status: OrderStatus,
  data: Partial<UpdateOrderStatusBody> & {
    paidAt?: Date | null;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
    cancelledAt?: Date | null;
  },
) {
  return this.prisma.order.update({
    where: {
      number,
    },

    data: {
      status,

      ...(data.trackingCode !== undefined && {
        trackingCode: data.trackingCode,
      }),

      ...(data.trackingUrl !== undefined && {
        trackingUrl: data.trackingUrl,
      }),

      ...(data.paidAt !== undefined && {
        paidAt: data.paidAt,
      }),

      ...(data.shippedAt !== undefined && {
        shippedAt: data.shippedAt,
      }),

      ...(data.deliveredAt !== undefined && {
        deliveredAt: data.deliveredAt,
      }),

      ...(data.cancelledAt !== undefined && {
        cancelledAt: data.cancelledAt,
      }),
    },

    select: {
      number: true,
      status: true,
      trackingCode: true,
      trackingUrl: true,
      paidAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
      updatedAt: true,
    },
  });
}

  async findAllByUserId(
    userId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    

    const [orders, totalItems] =
      await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: {
            userId,
          },

          select: orderListSelect,

          orderBy: {
            createdAt: "desc",
          },

          skip,
          take: limit,
        }),

        this.prisma.order.count({
          where: {
            userId,
          },
        }),
      ]);

    return {
      orders,
      totalItems,
    };
  }

  async findByNumberAndUserId(
    number: number,
    userId: string,
  ) {
    return this.prisma.order.findFirst({
      where: {
        number,
        userId,
      },

      select: orderDetailsSelect,
    });
  }
}