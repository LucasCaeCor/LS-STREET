import type {
  Prisma,
  PrismaClient,
  ProductStatus,
} from "@prisma/client";

export type ProductSortBy =
  | "name"
  | "createdAt"
  | "updatedAt";

export interface ListProductsFilters {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brand?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  minPriceInCents?: number;
  maxPriceInCents?: number;
  sortBy: ProductSortBy;
  sortOrder: "asc" | "desc";
}

export interface PublicProductFilters
  extends Omit<ListProductsFilters, "status"> {}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  categoryId: string;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  brand?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryId?: string;
}

const productInclude = {
  category: {
    select: {
      id: true,
      publicId: true,
      name: true,
      slug: true,
      isActive: true,
    },
  },

  images: {
    orderBy: {
      position: "asc",
    },

    select: {
      id: true,
      publicId: true,
      url: true,
      altText: true,
      position: true,
      isPrimary: true,
    },
  },

  variants: {
    orderBy: {
      priceInCents: "asc",
    },

    select: {
      id: true,
      publicId: true,
      sku: true,
      color: true,
      size: true,
      priceInCents: true,
      compareAtPriceInCents: true,
      stock: true,
      reservedStock: true,
      lowStockThreshold: true,
      isActive: true,
    },
  },
} satisfies Prisma.ProductInclude;

const publicProductInclude = {
  category: {
    select: {
      id: true,
      publicId: true,
      name: true,
      slug: true,
    },
  },

  images: {
    orderBy: {
      position: "asc",
    },

    select: {
      id: true,
      publicId: true,
      url: true,
      altText: true,
      position: true,
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
      id: true,
      publicId: true,
      sku: true,
      color: true,
      size: true,
      priceInCents: true,
      compareAtPriceInCents: true,
      stock: true,
      reservedStock: true,
      lowStockThreshold: true,
      isActive: true,
    },
  },
} satisfies Prisma.ProductInclude;

export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildWhere(
    filters: ListProductsFilters,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (filters.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          shortDescription: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.categorySlug) {
      where.category = {
        is: {
          slug: filters.categorySlug,
        },
      };
    }

    if (filters.brand) {
      where.brand = {
        equals: filters.brand,
        mode: "insensitive",
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (
      filters.minPriceInCents !== undefined ||
      filters.maxPriceInCents !== undefined
    ) {
      const priceFilter: Prisma.IntFilter = {};

      if (filters.minPriceInCents !== undefined) {
        priceFilter.gte = filters.minPriceInCents;
      }

      if (filters.maxPriceInCents !== undefined) {
        priceFilter.lte = filters.maxPriceInCents;
      }

      where.variants = {
        some: {
          priceInCents: priceFilter,
          isActive: true,
        },
      };
    }

    return where;
  }

  async findPublic(filters: PublicProductFilters) {
    const where = this.buildWhere({
      ...filters,
      status: "ACTIVE",
    });

    where.category = {
      is: {
        ...(filters.categorySlug
          ? {
              slug: filters.categorySlug,
            }
          : {}),

        isActive: true,
      },
    };

    where.variants = {
      some: {
        isActive: true,

        ...(filters.minPriceInCents !== undefined ||
        filters.maxPriceInCents !== undefined
          ? {
              priceInCents: {
                ...(filters.minPriceInCents !== undefined
                  ? {
                      gte: filters.minPriceInCents,
                    }
                  : {}),

                ...(filters.maxPriceInCents !== undefined
                  ? {
                      lte: filters.maxPriceInCents,
                    }
                  : {}),
              },
            }
          : {}),
      },
    };

    const skip = (filters.page - 1) * filters.limit;

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    const [products, totalItems] =
      await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          include: publicProductInclude,
          orderBy,
          skip,
          take: filters.limit,
        }),

        this.prisma.product.count({
          where,
        }),
      ]);

    return {
      products,
      totalItems,
    };
  }

  async findAdmin(filters: ListProductsFilters) {
    const where = this.buildWhere(filters);
    const skip = (filters.page - 1) * filters.limit;

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [filters.sortBy]: filters.sortOrder,
    };

    const [products, totalItems] =
      await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          include: productInclude,
          orderBy,
          skip,
          take: filters.limit,
        }),

        this.prisma.product.count({
          where,
        }),
      ]);

    return {
      products,
      totalItems,
    };
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: {
        id,
      },

      include: productInclude,
    });
  }

  async findByPublicId(publicId: string) {
    return this.prisma.product.findUnique({
      where: {
        publicId,
      },

      include: productInclude,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: {
        slug,
      },

      include: productInclude,
    });
  }

  async findPublicBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: {
        slug,
        status: "ACTIVE",

        category: {
          is: {
            isActive: true,
          },
        },

        variants: {
          some: {
            isActive: true,
          },
        },
      },

      include: publicProductInclude,
    });
  }

  async findByName(name: string) {
    return this.prisma.product.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
        publicId: true,
        name: true,
        slug: true,
      },
    });
  }

  async slugExists(
    slug: string,
    excludeProductId?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,

        ...(excludeProductId
          ? {
              id: {
                not: excludeProductId,
              },
            }
          : {}),
      },

      select: {
        id: true,
      },
    });

    return product !== null;
  }

  async categoryExists(categoryId: string) {
    const category =
      await this.prisma.category.findUnique({
        where: {
          id: categoryId,
        },

        select: {
          id: true,
          publicId: true,
          name: true,
          slug: true,
          isActive: true,
        },
      });

    return category;
  }

  async create(data: CreateProductData) {
    return this.prisma.product.create({
      data,
      include: productInclude,
    });
  }

  async update(
    id: string,
    data: UpdateProductData,
  ) {
    return this.prisma.product.update({
      where: {
        id,
      },

      data,

      include: productInclude,
    });
  }

  async updateStatus(
    id: string,
    status: ProductStatus,
  ) {
    return this.prisma.product.update({
      where: {
        id,
      },

      data: {
        status,
      },

      include: productInclude,
    });
  }

  async updateFeatured(
    id: string,
    isFeatured: boolean,
  ) {
    return this.prisma.product.update({
      where: {
        id,
      },

      data: {
        isFeatured,
      },

      include: productInclude,
    });
  }

  async hasOrderItems(id: string) {
    const total = await this.prisma.orderItem.count({
      where: {
        productId: id,
      },
    });

    return total > 0;
  }

  async delete(id: string) {
    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }
}