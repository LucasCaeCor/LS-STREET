import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
} from "@prisma/client";

interface CreatePaymentInput {
  orderId: string;

  gateway: "MERCADO_PAGO";
  method: PaymentMethod;
  status: "PENDING";

  amountInCents: number;

  gatewayOrderId: string;
  gatewayPaymentId: string;

  externalReference: string;
  rawStatus: string | null;

  ticketUrl: string;
  pixQrCode: string;
  pixQrCodeBase64: string;
  expiresAt: Date | null;
}

interface UpdatePaymentFromWebhookInput {
  paymentId: string;
  orderId: string;

  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;

  rawStatus: string | null;

  approvedAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  paidAt?: Date;
}

const paymentResponseSelect = {
  id: true,

  gateway: true,
  method: true,
  status: true,

  amountInCents: true,
  installments: true,

  gatewayOrderId: true,
  gatewayPaymentId: true,
  gatewayPreferenceId: true,

  externalReference: true,
  rawStatus: true,

  ticketUrl: true,
  pixQrCode: true,
  pixQrCodeBase64: true,
  expiresAt: true,

  approvedAt: true,
  cancelledAt: true,
  refundedAt: true,

  createdAt: true,
  updatedAt: true,
} as const;

export class PaymentRepository {
  constructor(
    private readonly prisma: PrismaClient,
  ) {}


  async findByGatewayOrderId(
  gatewayOrderId: string,
) {
  return this.prisma.payment.findFirst({
    where: {
      gatewayOrderId,
    },

    select: {
      id: true,
      orderId: true,
      status: true,
      rawStatus: true,

      approvedAt: true,
      cancelledAt: true,
      refundedAt: true,

      order: {
        select: {
          status: true,
          paidAt: true,
        },
      },
    },
  });
}

async updateFromWebhook(
  input: UpdatePaymentFromWebhookInput,
) {
  return this.prisma.$transaction(
    async (transaction) => {
      const payment =
        await transaction.payment.update({
          where: {
            id: input.paymentId,
          },

          data: {
            status:
              input.paymentStatus,

            rawStatus:
              input.rawStatus,

            ...(input.approvedAt
              ? {
                  approvedAt:
                    input.approvedAt,
                }
              : {}),

            ...(input.cancelledAt
              ? {
                  cancelledAt:
                    input.cancelledAt,
                }
              : {}),

            ...(input.refundedAt
              ? {
                  refundedAt:
                    input.refundedAt,
                }
              : {}),
          },

          select:
            paymentResponseSelect,
        });

      const order =
        await transaction.order.update({
          where: {
            id: input.orderId,
          },

          data: {
            status:
              input.orderStatus,

            ...(input.paidAt
              ? {
                  paidAt:
                    input.paidAt,
                }
              : {}),
          },

          select: {
            id: true,
            number: true,
            status: true,
            paidAt: true,
            updatedAt: true,
          },
        });

      return {
        payment,
        order,
      };
    },
  );
}

  async findOrderByNumberAndUserId(
    number: number,
    userId: string,
  ) {
    return this.prisma.order.findFirst({
      where: {
        number,
        userId,
      },

      select: {
        id: true,
        number: true,
        status: true,
        totalInCents: true,

        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findReusablePendingPayment(
    orderId: string,
    method: PaymentMethod,
  ) {
    return this.prisma.payment.findFirst({
      where: {
        orderId,
        method,

        status: {
          in: [
            "PENDING",
            "IN_PROCESS",
          ],
        },
      },

      select: paymentResponseSelect,

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async create(input: CreatePaymentInput) {
    return this.prisma.payment.create({
      data: {
        orderId: input.orderId,

        gateway: input.gateway,
        method: input.method,
        status: input.status,

        amountInCents: input.amountInCents,

        gatewayOrderId:
          input.gatewayOrderId,

        gatewayPaymentId:
          input.gatewayPaymentId,

        externalReference:
          input.externalReference,

        rawStatus:
          input.rawStatus,

        ticketUrl:
          input.ticketUrl,

        pixQrCode:
          input.pixQrCode,

        pixQrCodeBase64:
          input.pixQrCodeBase64,

        expiresAt:
          input.expiresAt,
      },

      select: paymentResponseSelect,
    });
  }

  async findLatestByOrderAndUser(
    number: number,
    userId: string,
  ) {
    return this.prisma.payment.findFirst({
      where: {
        order: {
          number,
          userId,
        },
      },

      select: paymentResponseSelect,

      orderBy: {
        createdAt: "desc",
      },
    });
  }
}