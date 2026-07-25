import type {
  Prisma,
  PrismaClient,
} from "@prisma/client";

export interface CreateProductImageData {
  productId: string;
  url: string;
  cloudinaryPublicId: string;
  originalFilename?: string | null;
  altText?: string | null;
  position: number;
  isPrimary: boolean;
}

export interface UpdateProductImageData {
  url?: string;
  cloudinaryPublicId?: string;
  originalFilename?: string | null;
  altText?: string | null;
  position?: number;
  isPrimary?: boolean;
}
const includeProductImage = {
  product: {
    select: {
      id: true,
      publicId: true,
      name: true,
      slug: true,
      status: true,
    },
  },
} satisfies Prisma.ProductImageInclude;

export class ProductImageRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string) {
    return this.prisma.productImage.findUnique({
      where: {
        id,
      },
      include: includeProductImage,
    });
  }

  async findByPublicId(publicId: string) {
    return this.prisma.productImage.findUnique({
      where: {
        publicId,
      },
      include: includeProductImage,
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
      },
    });
  }

  async listByProduct(productId: string) {
    return this.prisma.productImage.findMany({
      where: {
        productId,
      },
      include: includeProductImage,
      orderBy: [
        {
          isPrimary: "desc",
        },
        {
          position: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  async create(data: CreateProductImageData) {
    return this.prisma.productImage.create({
      data,
      include: includeProductImage,
    });
  }

  async update(
    id: string,
    data: UpdateProductImageData,
  ) {
    return this.prisma.productImage.update({
      where: {
        id,
      },
      data,
      include: includeProductImage,
    });
  }

  async delete(id: string) {
    return this.prisma.productImage.delete({
      where: {
        id,
      },
    });
  }

  async clearPrimary(
    productId: string,
    excludeImageId?: string,
  ) {
    return this.prisma.productImage.updateMany({
      where: {
        productId,
        isPrimary: true,

        ...(excludeImageId
          ? {
              id: {
                not: excludeImageId,
              },
            }
          : {}),
      },
      data: {
        isPrimary: false,
      },
    });
  }

  async setPrimary(id: string) {
    return this.prisma.productImage.update({
      where: {
        id,
      },
      data: {
        isPrimary: true,
      },
      include: includeProductImage,
    });
  }

  async countByProduct(productId: string) {
    return this.prisma.productImage.count({
      where: {
        productId,
      },
    });
  }

  async findFirstByProduct(
    productId: string,
    excludeImageId?: string,
  ) {
    return this.prisma.productImage.findFirst({
      where: {
        productId,

        ...(excludeImageId
          ? {
              id: {
                not: excludeImageId,
              },
            }
          : {}),
      },
      orderBy: [
        {
          position: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      include: includeProductImage,
    });
  }

  async positionExists(
    productId: string,
    position: number,
    excludeImageId?: string,
  ) {
    const image =
      await this.prisma.productImage.findFirst({
        where: {
          productId,
          position,

          ...(excludeImageId
            ? {
                id: {
                  not: excludeImageId,
                },
              }
            : {}),
        },
        select: {
          id: true,
        },
      });

    return image !== null;
  }
}