import type {
  Prisma,
  PrismaClient,
  UserStatus,
} from "@prisma/client";

import type {
  ListAdminCustomersQuery,
} from "./admin-customer.schema";

const customerListSelect = {
  id: true,
  publicId: true,

  name: true,
  email: true,
  phone: true,

  avatarUrl: true,

  role: true,
  status: true,

  emailVerified: true,
  lastLoginAt: true,

  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      orders: true,
      addresses: true,
      favorites: true,
    },
  },

  orders: {
    orderBy: {
      createdAt: "desc",
    },

    take: 1,

    select: {
      number: true,
      status: true,

      totalInCents: true,

      createdAt: true,
    },
  },
} satisfies Prisma.UserSelect;

const customerDetailsSelect = {
  id: true,
  publicId: true,

  name: true,
  email: true,
  phone: true,

  avatarUrl: true,

  role: true,
  status: true,

  emailVerified: true,
  lastLoginAt: true,

  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      orders: true,
      addresses: true,
      favorites: true,
    },
  },

  addresses: {
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        createdAt: "desc",
      },
    ],

    select: {
      publicId: true,

      recipientName: true,
      phone: true,

      zipCode: true,
      street: true,
      number: true,

      complement: true,
      neighborhood: true,

      city: true,
      state: true,
      country: true,

      label: true,
      isDefault: true,

      createdAt: true,
      updatedAt: true,
    },
  },

  orders: {
    orderBy: {
      createdAt: "desc",
    },

    take: 10,

    select: {
      number: true,
      status: true,

      subtotalInCents: true,
      discountInCents: true,
      shippingInCents: true,
      totalInCents: true,

      paidAt: true,
      createdAt: true,

      items: {
        take: 1,

        select: {
          productName: true,
          imageUrl: true,
        },
      },

      payments: {
        orderBy: {
          createdAt: "desc",
        },

        take: 1,

        select: {
          method: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export class AdminCustomerRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async findAll(
    query:
      ListAdminCustomersQuery,
  ) {
    const {
      page,
      limit,
      search,
      status,
      emailVerified,
      sortBy,
      sortOrder,
    } = query;

    const skip =
      (page - 1) * limit;

    const where:
      Prisma.UserWhereInput = {
        role: "CUSTOMER",

        ...(status && {
          status,
        }),

        ...(emailVerified !==
          undefined && {
          emailVerified,
        }),

        ...(search && {
          OR: [
            {
              name: {
                contains:
                  search,

                mode:
                  "insensitive",
              },
            },

            {
              email: {
                contains:
                  search,

                mode:
                  "insensitive",
              },
            },

            {
              phone: {
                contains:
                  search,
              },
            },

            {
              publicId: {
                contains:
                  search,
              },
            },
          ],
        }),
      };

    const orderBy =
      {
        [sortBy]:
          sortOrder,
      } as Prisma.UserOrderByWithRelationInput;

    const [
      customers,
      totalItems,
    ] =
      await this.prisma
        .$transaction([
          this.prisma.user
            .findMany({
              where,

              select:
                customerListSelect,

              orderBy,

              skip,
              take: limit,
            }),

          this.prisma.user
            .count({
              where,
            }),
        ]);

    return {
      customers,
      totalItems,
    };
  }

  async getSummary() {
    const customerWhere:
      Prisma.UserWhereInput = {
        role: "CUSTOMER",
      };

    const [
      total,
      active,
      inactive,
      blocked,
      verified,
    ] =
      await this.prisma
        .$transaction([
          this.prisma.user
            .count({
              where:
                customerWhere,
            }),

          this.prisma.user
            .count({
              where: {
                ...customerWhere,
                status:
                  "ACTIVE",
              },
            }),

          this.prisma.user
            .count({
              where: {
                ...customerWhere,
                status:
                  "INACTIVE",
              },
            }),

          this.prisma.user
            .count({
              where: {
                ...customerWhere,
                status:
                  "BLOCKED",
              },
            }),

          this.prisma.user
            .count({
              where: {
                ...customerWhere,

                emailVerified:
                  true,
              },
            }),
        ]);

    return {
      total,
      active,
      inactive,
      blocked,
      verified,
    };
  }

  async findByPublicId(
    publicId: string,
  ) {
    return this.prisma.user
      .findFirst({
        where: {
          publicId,
          role: "CUSTOMER",
        },

        select:
          customerDetailsSelect,
      });
  }

  async getPurchaseStats(
    userId: string,
  ) {
    return this.prisma.order
      .aggregate({
        where: {
          userId,

          status: {
            in: [
              "PAID",
              "PREPARING",
              "SHIPPED",
              "DELIVERED",
            ],
          },
        },

        _sum: {
          totalInCents:
            true,
        },

        _count: {
          _all: true,
        },
      });
  }

  async findStatusByPublicId(
    publicId: string,
  ) {
    return this.prisma.user
      .findFirst({
        where: {
          publicId,
          role: "CUSTOMER",
        },

        select: {
          id: true,
          publicId: true,

          name: true,
          email: true,

          role: true,
          status: true,
        },
      });
  }

  async updateStatus(
    publicId: string,
    status: UserStatus,
  ) {
    return this.prisma.user
      .update({
        where: {
          publicId,
        },

        data: {
          status,
        },

        select:
          customerListSelect,
      });
  }

  async revokeSessions(
    userId: string,
  ) {
    return this.prisma
      .refreshToken
      .updateMany({
        where: {
          userId,
          revokedAt: null,
        },

        data: {
          revokedAt:
            new Date(),
        },
      });
  }
}