import {
  Prisma,
  type PrismaClient,
} from "@prisma/client";

interface ListFavoritesInput {
  userId: string;

  page: number;
  limit: number;

  sortOrder: "asc" | "desc";
}

const favoriteSelect =
  Prisma.validator<Prisma.FavoriteSelect>()({
    id: true,
    createdAt: true,

    product: {
      select: {
        publicId: true,

        name: true,
        slug: true,

        shortDescription: true,
        brand: true,

        status: true,
        isFeatured: true,

        category: {
          select: {
            publicId: true,
            name: true,
            slug: true,
          },
        },

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

        variants: {
          where: {
            isActive: true,
          },

          orderBy: {
            priceInCents: "asc",
          },

          select: {
            publicId: true,

            sku: true,
            color: true,
            size: true,

            priceInCents: true,
            compareAtPriceInCents: true,

            stock: true,
            reservedStock: true,
          },
        },
      },
    },
  });

export class FavoriteRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async findProductByPublicId(
    productPublicId: string,
  ) {
    return this.prisma.product
      .findUnique({
        where: {
          publicId:
            productPublicId,
        },

        select: {
          id: true,
          publicId: true,

          name: true,
          status: true,
        },
      });
  }

  async findFavorite(
    userId: string,
    productId: string,
  ) {
    return this.prisma.favorite
      .findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },

        select: {
          id: true,
          createdAt: true,
        },
      });
  }

  async create(
    userId: string,
    productId: string,
  ) {
    return this.prisma.favorite
      .create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },

          product: {
            connect: {
              id: productId,
            },
          },
        },

        select:
          favoriteSelect,
      });
  }

  async delete(
    userId: string,
    productId: string,
  ) {
    return this.prisma.favorite
      .delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
  }

  async list(
    input: ListFavoritesInput,
  ) {
    const skip =
      (input.page - 1) *
      input.limit;

    const where = {
      userId: input.userId,

      product: {
        status: "ACTIVE" as const,
      },
    };

    const [
      favorites,
      totalItems,
    ] =
      await this.prisma
        .$transaction([
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
                favoriteSelect,
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

  async checkMany(
    userId: string,
    productIds: string[],
  ) {
    return this.prisma.favorite
      .findMany({
        where: {
          userId,

          product: {
            publicId: {
              in: productIds,
            },
          },
        },

        select: {
          product: {
            select: {
              publicId: true,
            },
          },
        },
      });
  }
}