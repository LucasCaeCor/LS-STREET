import type {
  InventoryMovementType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

export interface CreateInventoryMovementData {
  variantId: string;

  type: InventoryMovementType;
  quantity: number;

  previousStock: number;
  newStock: number;

  reason?: string;
  referenceId?: string;
}

export interface ListInventoryMovementsFilters {
  page: number;
  limit: number;

  search?: string;
  variantId?: string;

  type?: InventoryMovementType;

  sortOrder: "asc" | "desc";
}

const movementSelect = {
  id: true,
  publicId: true,

  type: true,
  quantity: true,

  previousStock: true,
  newStock: true,

  reason: true,
  referenceId: true,

  createdAt: true,

  variant: {
    select: {
      publicId: true,
      sku: true,
      color: true,
      size: true,

      stock: true,
      reservedStock: true,
      lowStockThreshold: true,

      product: {
        select: {
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
  },
} as const;

export class InventoryRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async findVariantByPublicId(
    publicId: string,
  ) {
    return this.prisma
      .productVariant
      .findUnique({
        where: {
          publicId,
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

          isActive: true,

          product: {
            select: {
              publicId: true,
              name: true,
              slug: true,
            },
          },
        },
      });
  }

  async adjustStock(
    data: CreateInventoryMovementData,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const variant =
          await transaction
            .productVariant
            .update({
              where: {
                id: data.variantId,
              },

              data: {
                stock:
                  data.newStock,
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

                isActive: true,

                product: {
                  select: {
                    publicId: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            });

        const movement =
          await transaction
            .inventoryMovement
            .create({
              data: {
                variantId:
                  data.variantId,

                type: data.type,
                quantity:
                  data.quantity,

                previousStock:
                  data.previousStock,

                newStock:
                  data.newStock,

                reason:
                  data.reason,

                referenceId:
                  data.referenceId,
              },

              select:
                movementSelect,
            });

        return {
          variant,
          movement,
        };
      },
    );
  }

  async listMovements(
    filters:
      ListInventoryMovementsFilters,
  ) {
    const where:
      Prisma.InventoryMovementWhereInput =
      {};

    if (filters.variantId) {
      where.variant = {
        publicId:
          filters.variantId,
      };
    }

    if (filters.type) {
      where.type =
        filters.type;
    }

    if (filters.search) {
      where.OR = [
        {
          reason: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },

        {
          referenceId: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },

        {
          variant: {
            sku: {
              contains:
                filters.search,

              mode: "insensitive",
            },
          },
        },

        {
          variant: {
            product: {
              name: {
                contains:
                  filters.search,

                mode:
                  "insensitive",
              },
            },
          },
        },
      ];
    }

    const skip =
      (filters.page - 1) *
      filters.limit;

    const [
      movements,
      totalItems,
    ] =
      await this.prisma
        .$transaction([
          this.prisma
            .inventoryMovement
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
                movementSelect,
            }),

          this.prisma
            .inventoryMovement
            .count({
              where,
            }),
        ]);

    return {
      movements,
      totalItems,
    };
  }
}