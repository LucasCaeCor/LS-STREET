import { AppError } from "../../core/errors/app-error";

import type {
  CreatePaymentBody,
} from "./payment.schema";

import { PaymentRepository } from "./payment.repository";

import { MercadoPagoGateway } from
  "../../infra/payments/mercado-pago-gateway";

const blockedOrderStatuses = [
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export class PaymentService {
  constructor(
    private readonly repository:
      PaymentRepository,

    private readonly mercadoPagoGateway:
      MercadoPagoGateway,
  ) {}

  async create(
    userId: string,
    orderNumber: number,
    input: CreatePaymentBody,
  ) {
    const order =
      await this.repository
        .findOrderByNumberAndUserId(
          orderNumber,
          userId,
        );

    if (!order) {
      throw new AppError(
        "Pedido não encontrado.",
        404,
        "ORDER_NOT_FOUND",
      );
    }

    if (
      blockedOrderStatuses.includes(
        order.status as
          (typeof blockedOrderStatuses)[number],
      )
    ) {
      throw new AppError(
        "Esse pedido não está disponível para pagamento.",
        422,
        "ORDER_NOT_PAYABLE",
        {
          orderStatus: order.status,
        },
      );
    }

    if (input.method !== "PIX") {
      throw new AppError(
        "No momento, apenas pagamentos via PIX estão disponíveis.",
        422,
        "PAYMENT_METHOD_NOT_AVAILABLE",
      );
    }

    const existingPayment =
      await this.repository
        .findReusablePendingPayment(
          order.id,
          input.method,
        );

    if (existingPayment) {
      return {
        payment: existingPayment,
        reused: true,
      };
    }

    const gatewayPayment =
      await this.mercadoPagoGateway
        .createPixPayment({
          orderNumber: order.number,

          amountInCents:
            order.totalInCents,

          payerEmail:
            order.user.email,

          payerFirstName:
            order.user.name,
        });

    const payment =
      await this.repository.create({
        orderId:
          order.id,

        gateway:
          "MERCADO_PAGO",

        method:
          "PIX",

        status:
          "PENDING",

        amountInCents:
          order.totalInCents,

        gatewayOrderId:
          gatewayPayment.gatewayOrderId,

        gatewayPaymentId:
          gatewayPayment.gatewayPaymentId,

        externalReference:
          gatewayPayment.externalReference,

        rawStatus:
          gatewayPayment.statusDetail,

        ticketUrl:
          gatewayPayment.ticketUrl,

        pixQrCode:
          gatewayPayment.qrCode,

        pixQrCodeBase64:
          gatewayPayment.qrCodeBase64,

        expiresAt:
          gatewayPayment.expiresAt,
      });

    return {
      payment,
      reused: false,
    };
  }

  async findLatest(
    userId: string,
    orderNumber: number,
  ) {
    const payment =
      await this.repository
        .findLatestByOrderAndUser(
          orderNumber,
          userId,
        );

    if (!payment) {
      throw new AppError(
        "Nenhum pagamento foi encontrado para esse pedido.",
        404,
        "PAYMENT_NOT_FOUND",
      );
    }

    return payment;
  }
}