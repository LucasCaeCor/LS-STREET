import { AppError } from "../../core/errors/app-error";

import type {
  CreatePaymentBody,
} from "./payment.schema";
import { env } from "../../config/env";
import { PaymentRepository } from "./payment.repository";

import { MercadoPagoGateway } from
  "../../infra/payments/mercado-pago-gateway";
  import type {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

interface ProcessMercadoPagoWebhookInput {
  xSignature?: string;
  xRequestId?: string;

  dataId?: string;
  type?: string;
}

interface MappedPaymentStatus {
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
}

function mapMercadoPagoStatus(
  status: string | null,
): MappedPaymentStatus {
  switch (status) {
    case "processed":
      return {
        paymentStatus: "APPROVED",
        orderStatus: "PAID",
      };

    case "processing":
    case "in_review":
      return {
        paymentStatus: "IN_PROCESS",
        orderStatus:
          "PAYMENT_IN_REVIEW",
      };

    case "failed":
      return {
        paymentStatus: "REJECTED",
        orderStatus:
          "PENDING_PAYMENT",
      };

    case "canceled":
    case "expired":
      return {
        paymentStatus: "CANCELLED",
        orderStatus:
          "PENDING_PAYMENT",
      };

    case "refunded":
      return {
        paymentStatus: "REFUNDED",
        orderStatus: "REFUNDED",
      };

    case "charged_back":
      return {
        paymentStatus:
          "CHARGED_BACK",
        orderStatus: "REFUNDED",
      };

    case "created":
    case "action_required":
    default:
      return {
        paymentStatus: "PENDING",
        orderStatus:
          "PENDING_PAYMENT",
      };
  }
}

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

  async processMercadoPagoWebhook(
  input: ProcessMercadoPagoWebhookInput,
) {
const webhookSecret =
  env.MERCADO_PAGO_WEBHOOK_SECRET;

  

  if (!input.dataId) {
    throw new AppError(
      "O ID da order não foi informado pelo Mercado Pago.",
      400,
      "MERCADO_PAGO_ORDER_ID_NOT_PROVIDED",
    );
  }

  this.mercadoPagoGateway
    .validateWebhookSignature({
      xSignature:
        input.xSignature,

      xRequestId:
        input.xRequestId,

      dataId:
        input.dataId,

      secret:
        webhookSecret,
    });

  if (
    input.type &&
    input.type !== "order"
  ) {
    return {
      processed: false,
      ignored: true,
      reason:
        "WEBHOOK_TYPE_IGNORED",
    };
  }

  const gatewayOrder =
    await this.mercadoPagoGateway
      .getOrderById(input.dataId);

  const currentPayment =
    await this.repository
      .findByGatewayOrderId(
        gatewayOrder.gatewayOrderId,
      );

  if (!currentPayment) {
    return {
      processed: false,
      ignored: true,
      reason:
        "PAYMENT_NOT_FOUND",
    };
  }

  const gatewayStatus =
    gatewayOrder.paymentStatus ??
    gatewayOrder.orderStatus;

  const gatewayStatusDetail =
    gatewayOrder
      .paymentStatusDetail ??
    gatewayOrder
      .orderStatusDetail ??
    gatewayStatus;

  const mappedStatus =
    mapMercadoPagoStatus(
      gatewayStatus,
    );

  const currentStatus =
    currentPayment.status;

  const incomingStatus =
    mappedStatus.paymentStatus;

  const isCurrentRefunded =
    currentStatus === "REFUNDED" ||
    currentStatus ===
      "CHARGED_BACK";

  const isApprovedDowngrade =
    currentStatus === "APPROVED" &&
    incomingStatus !== "REFUNDED" &&
    incomingStatus !==
      "CHARGED_BACK";

  if (
    isCurrentRefunded ||
    isApprovedDowngrade
  ) {
    return {
      processed: false,
      ignored: true,
      reason:
        "OLDER_PAYMENT_STATUS",
    };
  }

  if (
    currentStatus ===
      incomingStatus &&
    currentPayment.rawStatus ===
      gatewayStatusDetail &&
    currentPayment.order.status ===
      mappedStatus.orderStatus
  ) {
    return {
      processed: false,
      ignored: true,
      reason:
        "PAYMENT_ALREADY_UPDATED",
    };
  }

  const now = new Date();

  const result =
    await this.repository
      .updateFromWebhook({
        paymentId:
          currentPayment.id,

        orderId:
          currentPayment.orderId,

        paymentStatus:
          mappedStatus.paymentStatus,

        orderStatus:
          mappedStatus.orderStatus,

        rawStatus:
          gatewayStatusDetail,

        approvedAt:
          mappedStatus.paymentStatus ===
            "APPROVED" &&
          !currentPayment.approvedAt
            ? now
            : undefined,

        cancelledAt:
          mappedStatus.paymentStatus ===
            "CANCELLED" &&
          !currentPayment.cancelledAt
            ? now
            : undefined,

        refundedAt:
          (
            mappedStatus.paymentStatus ===
              "REFUNDED" ||
            mappedStatus.paymentStatus ===
              "CHARGED_BACK"
          ) &&
          !currentPayment.refundedAt
            ? now
            : undefined,

        paidAt:
          mappedStatus.orderStatus ===
            "PAID" &&
          !currentPayment.order.paidAt
            ? now
            : undefined,
      });

  return {
    processed: true,
    ignored: false,
    payment: result.payment,
    order: result.order,
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