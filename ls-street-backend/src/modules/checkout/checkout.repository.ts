import type {
  Prisma,
  PrismaClient,
} from "@prisma/client";

type TransactionClient = Prisma.TransactionClient;

export class CheckoutRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}

  async transaction<T>(
    callback: (
      transaction: TransactionClient,
    ) => Promise<T>,
  ) {
    return this.prisma.$transaction(callback);
  }

  async findUserById(
    transaction: TransactionClient,
    userId: string,
  ) {
    return transaction.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
      },
    });
  }

  async findAddress(
    transaction: TransactionClient,
    userId: string,
    addressPublicId: string,
  ) {
    return transaction.address.findFirst({
      where: {
        publicId: addressPublicId,
        userId,
      },

      select: {
        id: true,
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
      },
    });
  }

  async findCart(
    transaction: TransactionClient,
    userId: string,
  ) {
    return transaction.cart.findUnique({
      where: {
        userId,
      },

      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },

          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: {
                      where: {
                        isPrimary: true,
                      },

                      orderBy: {
                        position: "asc",
                      },

                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async generateOrderNumber(
    transaction: TransactionClient,
  ) {
    const sequence =
      await transaction.sequence.upsert({
        where: {
          name: "order",
        },

        create: {
          name: "order",
          value: 1,
        },

        update: {
          value: {
            increment: 1,
          },
        },

        select: {
          value: true,
        },
      });

    return sequence.value;
  }

  async decrementVariantStock(
    transaction: TransactionClient,
    variantId: string,
    quantity: number,
  ) {
    return transaction.productVariant.updateMany({
      where: {
        id: variantId,
        isActive: true,

        stock: {
          gte: quantity,
        },
      },

      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  }

  async createOrder(
    transaction: TransactionClient,
    data: Prisma.OrderCreateInput,
  ) {
    return transaction.order.create({
      data,

      include: {
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            sku: true,
            imageUrl: true,
            unitPriceInCents: true,
            quantity: true,
            totalInCents: true,
          },
        },
      },
    });
  }

  async clearCart(
    transaction: TransactionClient,
    cartId: string,
  ) {
    return transaction.cartItem.deleteMany({
      where: {
        cartId,
      },
    });
  }
}