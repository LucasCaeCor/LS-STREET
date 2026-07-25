import type {
  Prisma,
  PrismaClient,
} from "@prisma/client";

export interface ListProductVariantsFilters {
  productId: string;
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
  sortBy:
    | "sku"
    | "priceInCents"
    | "stock"
    | "createdAt"
    | "updatedAt";
  sortOrder: "asc" | "desc";
}

export interface CreateProductVariantData {
  productId: string;
  sku: string;
  color?: string;
  size?: string;
  priceInCents: number;
  compareAtPriceInCents?: number | null;
  costInCents?: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  barcode?: string | null;
  weightInGrams?: number | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  isActive: boolean;
}

export interface UpdateProductVariantData {
  sku?: string;
  color?: string | null;
  size?: string | null;
  priceInCents?: number;
  compareAtPriceInCents?: number | null;
  costInCents?: number | null;
  lowStockThreshold?: number;
  barcode?: string | null;
  weightInGrams?: number | null;
  height?: number | null;
  width?: number | null;
  length?: number | null;
  isActive?: boolean;
}

const includeVariant = {
  product: {
    select: {
      id: true,
      publicId: true,
      name: true,
      slug: true,
      status: true,
    },
  },
} satisfies Prisma.ProductVariantInclude;

export class ProductVariantRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string) {
    return this.prisma.productVariant.findUnique({
      where: { id },
      include: includeVariant,
    });
  }

  async findByPublicId(publicId: string) {
    return this.prisma.productVariant.findUnique({
      where: { publicId },
      include: includeVariant,
    });
  }

  async findBySku(sku: string) {
    return this.prisma.productVariant.findUnique({
      where: { sku },
    });
  }

  async skuExists(
    sku: string,
    excludeId?: string,
  ) {
    const variant =
      await this.prisma.productVariant.findFirst({
        where: {
          sku,
          ...(excludeId
            ? {
                id: {
                  not: excludeId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

    return variant !== null;
  }

  async productExists(productId: string) {
    return this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        publicId: true,
        name: true,
        status: true,
      },
    });
  }

  async create(
    data: CreateProductVariantData,
  ) {
    return this.prisma.productVariant.create({
      data,
      include: includeVariant,
    });
  }

  async update(
    id: string,
    data: UpdateProductVariantData,
  ) {
    return this.prisma.productVariant.update({
      where: { id },
      data,
      include: includeVariant,
    });
  }

  async updateStatus(
    id: string,
    isActive: boolean,
  ) {
    return this.prisma.productVariant.update({
      where: { id },
      data: {
        isActive,
      },
      include: includeVariant,
    });
  }

  async delete(id: string) {
    return this.prisma.productVariant.delete({
      where: { id },
    });
  }

  async findProductByPublicId(publicId: string) {
  return this.prisma.product.findUnique({
    where: {
      publicId,
    },
    select: {
      id: true,
      publicId: true,
      name: true,
      slug: true,
      status: true,
      category: {
        select: {
          isActive: true,
        },
      },
    },
  });
}

async combinationExists(
  productId: string,
  color: string | null,
  size: string | null,
  excludeId?: string,
) {
  const variant =
    await this.prisma.productVariant.findFirst({
      where: {
        productId,

        color:
          color === null
            ? null
            : {
                equals: color,
                mode: "insensitive",
              },

        size:
          size === null
            ? null
            : {
                equals: size,
                mode: "insensitive",
              },

        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },

      select: {
        id: true,
      },
    });

  return variant !== null;
}

async hasOrderItems(id: string) {
  const total =
    await this.prisma.orderItem.count({
      where: {
        variantId: id,
      },
    });

  return total > 0;
}
  async listByProduct(
    filters: ListProductVariantsFilters,
  ) {
    const where: Prisma.ProductVariantWhereInput = {
      productId: filters.productId,
    };

    if (filters.search) {
      where.OR = [
        {
          sku: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          color: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          size: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.lowStock) {
      where.AND = [
        {
          stock: {
            lte: 5,
          },
        },
      ];
    }

    const skip =
      (filters.page - 1) * filters.limit;

    const orderBy: Prisma.ProductVariantOrderByWithRelationInput =
      {
        [filters.sortBy]: filters.sortOrder,
      };

    const [variants, totalItems] =
      await this.prisma.$transaction([
        this.prisma.productVariant.findMany({
          where,
          include: includeVariant,
          orderBy,
          skip,
          take: filters.limit,
        }),

        this.prisma.productVariant.count({
          where,
        }),
      ]);

    return {
      variants,
      totalItems,
    };
  }
}