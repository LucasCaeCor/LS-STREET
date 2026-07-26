import type {
  CouponType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

interface ListCouponsFilters {
  page: number;
  limit: number;

  search?: string;
  type?: CouponType;
  active?: boolean;

  sortOrder: "asc" | "desc";
}

const couponSelect = {
  id: true,
  code: true,
  description: true,

  type: true,
  value: true,

  minimumOrderInCents: true,
  maximumDiscountInCents: true,

  usageLimit: true,
  usageCount: true,
  usageLimitPerUser: true,

  startsAt: true,
  expiresAt: true,

  active: true,

  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      orders: true,
    },
  },
} as const;

export class CouponRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async findById(
    couponId: string,
  ) {
    return this.prisma.coupon
      .findUnique({
        where: {
          id: couponId,
        },

        select: couponSelect,
      });
  }

  async findByCode(
    code: string,
  ) {
    return this.prisma.coupon
      .findUnique({
        where: {
          code,
        },

        select: couponSelect,
      });
  }

  async create(
    data:
      Prisma.CouponCreateInput,
  ) {
    return this.prisma.coupon
      .create({
        data,
        select: couponSelect,
      });
  }

  async update(
    couponId: string,
    data:
      Prisma.CouponUpdateInput,
  ) {
    return this.prisma.coupon
      .update({
        where: {
          id: couponId,
        },

        data,
        select: couponSelect,
      });
  }

  async list(
    filters:
      ListCouponsFilters,
  ) {
    const where:
      Prisma.CouponWhereInput = {};

    if (
      filters.active !==
      undefined
    ) {
      where.active =
        filters.active;
    }

    if (filters.type) {
      where.type =
        filters.type;
    }

    if (filters.search) {
      where.OR = [
        {
          code: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },

        {
          description: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },
      ];
    }

    const skip =
      (filters.page - 1) *
      filters.limit;

    const [
      coupons,
      totalItems,
    ] =
      await this.prisma
        .$transaction([
          this.prisma.coupon
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
                couponSelect,
            }),

          this.prisma.coupon
            .count({
              where,
            }),
        ]);

    return {
      coupons,
      totalItems,
    };
  }

  async countUserUsage(
    couponId: string,
    userId: string,
  ) {
    return this.prisma.order
      .count({
        where: {
          couponId,
          userId,

          status: {
            notIn: [
              "CANCELLED",
              "REFUNDED",
            ],
          },
        },
      });
  }
}