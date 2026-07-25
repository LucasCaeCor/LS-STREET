import type {
  Prisma,
  PrismaClient,
} from "@prisma/client";

const cartInclude = {
  items: {
    orderBy: {
      createdAt: "asc",
    },

    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              publicId: true,
              name: true,
              slug: true,
              status: true,

              images: {
                where: {
                  isPrimary: true,
                },

                orderBy: {
                  position: "asc",
                },

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
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export class CartRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async findByUserId(userId: string) {
    return this.prisma.cart.findUnique({
      where: {
        userId,
      },

      include: cartInclude,
    });
  }

  async findOrCreateByUserId(userId: string) {
    const existingCart =
      await this.findByUserId(userId);

    if (existingCart) {
      return existingCart;
    }

    return this.prisma.cart.create({
      data: {
        userId,
      },

      include: cartInclude,
    });
  }

  async findVariantByPublicId(publicId: string) {
    return this.prisma.productVariant.findUnique({
      where: {
        publicId,
      },

      include: {
        product: {
          select: {
            id: true,
            publicId: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }

  async findItemById(id: string) {
    return this.prisma.cartItem.findUnique({
      where: {
        id,
      },

      include: {
        cart: {
          select: {
            id: true,
            userId: true,
          },
        },

        variant: {
          include: {
            product: {
              select: {
                id: true,
                publicId: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  async findItemByCartAndVariant(
    cartId: string,
    variantId: string,
  ) {
    return this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },

      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                publicId: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  async createItem(
    cartId: string,
    variantId: string,
    quantity: number,
  ) {
    return this.prisma.cartItem.create({
      data: {
        cartId,
        variantId,
        quantity,
      },
    });
  }

  async updateItemQuantity(
    itemId: string,
    quantity: number,
  ) {
    return this.prisma.cartItem.update({
      where: {
        id: itemId,
      },

      data: {
        quantity,
      },
    });
  }

  async deleteItem(itemId: string) {
    return this.prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });
  }

  async clearCart(cartId: string) {
    return this.prisma.cartItem.deleteMany({
      where: {
        cartId,
      },
    });
  }

  async countItems(cartId: string) {
    return this.prisma.cartItem.count({
      where: {
        cartId,
      },
    });
  }
}