import type {
  Prisma,
  PrismaClient,
} from "@prisma/client";

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