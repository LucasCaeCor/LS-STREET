import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";

interface ListAdminFavoritesInput {
  page: number;
  limit: number;

  search?: string;

  sortOrder:
    | "asc"
    | "desc";
}

const adminFavoriteSelect =
  Prisma.validator<Prisma.FavoriteSelect>()({
    id: true,
    createdAt: true,

    user: {
      select: {
        publicId: true,
        name: true,
        email: true,
        status: true,
      },
    },

    product: {
      select: {
        publicId: true,
        name: true,
        slug: true,
        brand: true,
        status: true,

        images: {
          orderBy: [
            {
              isPrimary: "desc",
            },
            {
              position: "asc",
            },
          ],

          take: 1,

          select: {
            publicId: true,
            url: true,
            altText: true,
            isPrimary: true,
          },
        },
      },
    },
  });

export class AdminFavoriteRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async list(
    input: ListAdminFavoritesInput,
  ) {
    const skip =
      (input.page - 1) *
      input.limit;

    const where:
      Prisma.FavoriteWhereInput =
      input.search
        ? {
            OR: [
              {
                user: {
                  is: {
                    name: {
                      contains:
                        input.search,
                    },
                  },
                },
              },

              {
                user: {
                  is: {
                    email: {
                      contains:
                        input.search,
                    },
                  },
                },
              },

              {
                product: {
                  is: {
                    name: {
                      contains:
                        input.search,
                    },
                  },
                },
              },

              {
                product: {
                  is: {
                    brand: {
                      contains:
                        input.search,
                    },
                  },
                },
              },
            ],
          }
        : {};

    const [
      favorites,
      totalItems,
    ] = await Promise.all([
      this.prisma.favorite
        .findMany({
          where,

          skip,
          take: input.limit,

          orderBy: {
            createdAt:
              input.sortOrder,
          },

          select:
            adminFavoriteSelect,
        }),

      this.prisma.favorite
        .count({
          where,
        }),
    ]);

    return {
      favorites,
      totalItems,
    };
  }

  async summary() {
    const lastThirtyDays =
      new Date();

    lastThirtyDays.setDate(
      lastThirtyDays.getDate() -
        30,
    );

    const [
      totalFavorites,
      customersWithFavorites,
      productsFavorited,
      favoritesLastThirtyDays,
    ] = await Promise.all([
      this.prisma.favorite.count(),

      this.prisma.user.count({
        where: {
          role: "CUSTOMER",

          favorites: {
            some: {},
          },
        },
      }),

      this.prisma.product.count({
        where: {
          favorites: {
            some: {},
          },
        },
      }),

      this.prisma.favorite.count({
        where: {
          createdAt: {
            gte: lastThirtyDays,
          },
        },
      }),
    ]);

    return {
      totalFavorites,
      customersWithFavorites,
      productsFavorited,
      favoritesLastThirtyDays,
    };
  }
}