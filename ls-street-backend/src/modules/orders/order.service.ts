import { AppError } from "../../core/errors/app-error";

import { OrderRepository } from "./order.repository";

interface ListOrdersInput {
  page: number;
  limit: number;
}

export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
  ) {}

  async list(
    userId: string,
    input: ListOrdersInput,
  ) {
    const { page, limit } = input;

    const { orders, totalItems } =
      await this.repository.findAllByUserId(
        userId,
        page,
        limit,
      );

    const totalPages = Math.ceil(
      totalItems / limit,
    );

    return {
      orders: orders.map((order) => {
        const itemsCount = order.items.reduce(
          (total, item) =>
            total + item.quantity,
          0,
        );

        const firstItem =
          order.items[0] ?? null;

        const latestPayment =
          order.payments[0] ?? null;

        return {
          number: order.number,
          status: order.status,

          itemsCount,

          preview: firstItem
            ? {
                productName:
                  firstItem.productName,
                imageUrl:
                  firstItem.imageUrl,
              }
            : null,

          payment: latestPayment
            ? {
                gateway:
                  latestPayment.gateway,
                method:
                  latestPayment.method,
                status:
                  latestPayment.status,
              }
            : null,

          totals: {
            subtotalInCents:
              order.subtotalInCents,

            discountInCents:
              order.discountInCents,

            shippingInCents:
              order.shippingInCents,

            totalInCents:
              order.totalInCents,
          },

          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      }),

      pagination: {
        page,
        limit,
        totalItems,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    };
  }

  async findByNumber(
    userId: string,
    number: number,
  ) {
    const order =
      await this.repository.findByNumberAndUserId(
        number,
        userId,
      );

    if (!order) {
      throw new AppError(
        "Pedido não encontrado.",
        404,
        "ORDER_NOT_FOUND",
      );
    }

    return {
      number: order.number,
      status: order.status,

      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },

      shippingAddress: {
        recipient: order.recipient,
        zipCode: order.shippingZipCode,
        street: order.shippingStreet,
        number: order.shippingNumber,
        complement:
          order.shippingComplement,
        district:
          order.shippingDistrict,
        city: order.shippingCity,
        state: order.shippingState,
        country: order.shippingCountry,
      },

      shipping: {
        trackingCode:
          order.trackingCode,
        trackingUrl:
          order.trackingUrl,
        shippedAt:
          order.shippedAt,
        deliveredAt:
          order.deliveredAt,
      },

      coupon: order.couponCode
        ? {
            code: order.couponCode,
          }
        : null,

      totals: {
        subtotalInCents:
          order.subtotalInCents,

        discountInCents:
          order.discountInCents,

        shippingInCents:
          order.shippingInCents,

        totalInCents:
          order.totalInCents,
      },

      items: order.items.map((item) => ({
        productName:
          item.productName,

        variantName:
          item.variantName,

        sku: item.sku,
        imageUrl: item.imageUrl,

        unitPriceInCents:
          item.unitPriceInCents,

        quantity: item.quantity,

        totalInCents:
          item.totalInCents,
      })),

      payments: order.payments.map(
        (payment) => ({
          gateway: payment.gateway,
          method: payment.method,
          status: payment.status,

          amountInCents:
            payment.amountInCents,

          installments:
            payment.installments,

          approvedAt:
            payment.approvedAt,

          cancelledAt:
            payment.cancelledAt,

          refundedAt:
            payment.refundedAt,

          createdAt:
            payment.createdAt,

          updatedAt:
            payment.updatedAt,
        }),
      ),

      dates: {
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        paidAt: order.paidAt,
        shippedAt: order.shippedAt,
        deliveredAt:
          order.deliveredAt,
        cancelledAt:
          order.cancelledAt,
      },
    };
  }
}