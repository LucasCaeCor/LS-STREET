import type {
  OrderStatus,
  ProductStatus,
  UserStatus,
} from "@prisma/client";

import { CheckoutRepository } from "./checkout.repository";

import type {
  CreateCheckoutInput,
} from "./checkout.schema";

interface CheckoutServiceErrorOptions {
  statusCode: number;
  code: string;
}

export class CheckoutServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    options: CheckoutServiceErrorOptions,
  ) {
    super(message);

    this.name = "CheckoutServiceError";
    this.statusCode = options.statusCode;
    this.code = options.code;
  }
}

function createVariantName(
  color?: string | null,
  size?: string | null,
) {
  const attributes = [color, size].filter(
    (value): value is string =>
      Boolean(value?.trim()),
  );

  return attributes.length > 0
    ? attributes.join(" / ")
    : null;
}
interface CheckoutCoupon {
  id: string;
  code: string;

  type:
    | "PERCENTAGE"
    | "FIXED"
    | "FREE_SHIPPING";

  value: number;

  minimumOrderInCents: number;
  maximumDiscountInCents:
    | number
    | null;

  usageLimit: number | null;
  usageCount: number;

  usageLimitPerUser:
    | number
    | null;

  startsAt: Date | null;
  expiresAt: Date | null;

  active: boolean;
}

function calculateCouponDiscount(
  coupon: CheckoutCoupon,
  subtotalInCents: number,
) {
  if (
    coupon.type === "PERCENTAGE"
  ) {
    let discountInCents =
      Math.floor(
        subtotalInCents *
          coupon.value /
          100,
      );

    if (
      coupon
        .maximumDiscountInCents !==
      null
    ) {
      discountInCents =
        Math.min(
          discountInCents,
          coupon
            .maximumDiscountInCents,
        );
    }

    return discountInCents;
  }

  if (coupon.type === "FIXED") {
    return Math.min(
      coupon.value,
      subtotalInCents,
    );
  }

  return 0;
}

export class CheckoutService {
  constructor(
    private readonly repository:
      CheckoutRepository,
  ) {}

  async create(
    userId: string,
    input: CreateCheckoutInput,
  ) {
    return this.repository.transaction(
      async (transaction) => {
        const user =
          await this.repository.findUserById(
            transaction,
            userId,
          );

        if (!user) {
          throw new CheckoutServiceError(
            "Usuário não encontrado.",
            {
              statusCode: 404,
              code: "USER_NOT_FOUND",
            },
          );
        }

        if (user.status !== "ACTIVE") {
          throw new CheckoutServiceError(
            "Sua conta não está disponível para realizar pedidos.",
            {
              statusCode: 403,
              code: "USER_NOT_ACTIVE",
            },
          );
        }

        const address =
          await this.repository.findAddress(
            transaction,
            userId,
            input.addressId,
          );

        if (!address) {
          throw new CheckoutServiceError(
            "Endereço de entrega não encontrado.",
            {
              statusCode: 404,
              code: "ADDRESS_NOT_FOUND",
            },
          );
        }

        const cart =
          await this.repository.findCart(
            transaction,
            userId,
          );

        if (!cart || cart.items.length === 0) {
          throw new CheckoutServiceError(
            "Seu carrinho está vazio.",
            {
              statusCode: 422,
              code: "CART_EMPTY",
            },
          );
        }

        let subtotalInCents = 0;

        for (const item of cart.items) {
          const { variant } = item;
          const { product } = variant;

          if (product.status !== "ACTIVE") {
            throw new CheckoutServiceError(
              `O produto "${product.name}" não está mais disponível.`,
              {
                statusCode: 422,
                code: "PRODUCT_NOT_AVAILABLE",
              },
            );
          }

          if (!variant.isActive) {
            throw new CheckoutServiceError(
              `A variação do produto "${product.name}" não está mais disponível.`,
              {
                statusCode: 422,
                code: "VARIANT_NOT_AVAILABLE",
              },
            );
          }

          if (variant.stock < item.quantity) {
            throw new CheckoutServiceError(
              `Estoque insuficiente para "${product.name}".`,
              {
                statusCode: 422,
                code: "INSUFFICIENT_STOCK",
              },
            );
          }

          subtotalInCents +=
            variant.priceInCents * item.quantity;
        }

        let coupon:
  CheckoutCoupon | null = null;

let discountInCents = 0;
let shippingInCents = 0;

if (input.couponCode) {
  coupon =
    await this.repository
      .findCouponByCode(
        transaction,
        input.couponCode,
      );

  if (!coupon) {
    throw new CheckoutServiceError(
      "Cupom não encontrado.",
      {
        statusCode: 404,
        code: "COUPON_NOT_FOUND",
      },
    );
  }

  if (!coupon.active) {
    throw new CheckoutServiceError(
      "Este cupom está inativo.",
      {
        statusCode: 422,
        code: "COUPON_INACTIVE",
      },
    );
  }

  const now = new Date();

  if (
    coupon.startsAt &&
    coupon.startsAt > now
  ) {
    throw new CheckoutServiceError(
      "Este cupom ainda não está disponível.",
      {
        statusCode: 422,
        code: "COUPON_NOT_STARTED",
      },
    );
  }

  if (
    coupon.expiresAt &&
    coupon.expiresAt < now
  ) {
    throw new CheckoutServiceError(
      "Este cupom expirou.",
      {
        statusCode: 422,
        code: "COUPON_EXPIRED",
      },
    );
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageCount >=
      coupon.usageLimit
  ) {
    throw new CheckoutServiceError(
      "O limite de uso deste cupom foi atingido.",
      {
        statusCode: 422,
        code:
          "COUPON_USAGE_LIMIT_REACHED",
      },
    );
  }

  if (
    subtotalInCents <
    coupon.minimumOrderInCents
  ) {
    throw new CheckoutServiceError(
      "O valor mínimo do pedido para este cupom não foi atingido.",
      {
        statusCode: 422,
        code:
          "COUPON_MINIMUM_ORDER_NOT_REACHED",
      },
    );
  }

  if (
    coupon.usageLimitPerUser !==
    null
  ) {
    const userUsage =
      await this.repository
        .countCouponUsageByUser(
          transaction,
          coupon.id,
          userId,
        );

    if (
      userUsage >=
      coupon.usageLimitPerUser
    ) {
      throw new CheckoutServiceError(
        "Você já atingiu o limite de uso deste cupom.",
        {
          statusCode: 422,
          code:
            "COUPON_USER_LIMIT_REACHED",
        },
      );
    }
  }

  discountInCents =
    calculateCouponDiscount(
      coupon,
      subtotalInCents,
    );

  if (
    coupon.type ===
    "FREE_SHIPPING"
  ) {
    shippingInCents = 0;
  }
}

const totalInCents = Math.max(
  0,
  subtotalInCents -
    discountInCents +
    shippingInCents,
);

        const orderNumber =
          await this.repository.generateOrderNumber(
            transaction,
          );

        /*
         * O updateMany faz uma segunda validação do
         * estoque durante o desconto.
         *
         * Isso reduz o risco de dois checkouts
         * comprarem a última unidade ao mesmo tempo.
         */
        for (const item of cart.items) {
          const stockUpdate =
            await this.repository.decrementVariantStock(
              transaction,
              item.variant.id,
              item.quantity,
            );

          if (stockUpdate.count !== 1) {
            throw new CheckoutServiceError(
              `O estoque de "${item.variant.product.name}" foi alterado. Atualize o carrinho e tente novamente.`,
              {
                statusCode: 409,
                code: "STOCK_CHANGED",
              },
            );
          }
        }

        const order =
          await this.repository.createOrder(
            transaction,
            {
              number: orderNumber,
              status: "PENDING_PAYMENT",

              subtotalInCents,
              discountInCents,
              shippingInCents,
              totalInCents,

              couponCode:
                coupon?.code ?? null,

              customerName: user.name,
              customerEmail: user.email,
              customerPhone:
                user.phone ?? address.phone,

              recipient: address.recipientName,

              shippingZipCode: address.zipCode,
              shippingStreet: address.street,
              shippingNumber: address.number,
              shippingComplement:
                address.complement,
              shippingDistrict:
                address.neighborhood,
              shippingCity: address.city,
              shippingState: address.state,
              shippingCountry: address.country,

              user: {
                connect: {
                  id: user.id,
                },
              },

              address: {
                connect: {
                  id: address.id,
                },
              },
            ...(coupon
                ? {
                    coupon: {
                        connect: {
                        id: coupon.id,
                        },
                    },
                    }
                : {}),

              items: {
                create: cart.items.map(
                  (item) => {
                    const { variant } = item;
                    const { product } = variant;

                    const totalItemInCents =
                      variant.priceInCents *
                      item.quantity;

                    return {
                      productName: product.name,

                      variantName:
                        createVariantName(
                          variant.color,
                          variant.size,
                        ),

                      sku: variant.sku,

                      imageUrl:
                        product.images[0]?.url ??
                        null,

                      unitPriceInCents:
                        variant.priceInCents,

                      quantity: item.quantity,

                      totalInCents:
                        totalItemInCents,

                      product: {
                        connect: {
                          id: product.id,
                        },
                      },

                      variant: {
                        connect: {
                          id: variant.id,
                        },
                      },
                    };
                  },
                ),
              },
            },
          );
          if (coupon) {
            await this.repository
                .incrementCouponUsage(
                transaction,
                coupon.id,
                );
            }

        await this.repository.clearCart(
          transaction,
          cart.id,
        );

        return order;
      },
    );
  }
}