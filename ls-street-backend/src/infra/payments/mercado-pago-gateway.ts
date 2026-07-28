import { randomUUID } from "node:crypto";

import { AppError } from "../../core/errors/app-error";
import { mercadoPagoOrder } from "./mercado-pago";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import { env } from "../../config/env";

interface CreatePixPaymentInput {
  orderNumber: number;
  amountInCents: number;
  payerEmail: string;
  payerFirstName?: string;
}

export interface MercadoPagoPixResult {
  gatewayOrderId: string;
  gatewayPaymentId: string;

  externalReference: string;

  status: string;
  statusDetail: string | null;

  ticketUrl: string;
  qrCode: string;
  qrCodeBase64: string;

  expiresAt: Date | null;
}

interface ValidateWebhookSignatureInput {
  xSignature?: string;
  xRequestId?: string;
  dataId?: string;
  secret: string;
}

export interface MercadoPagoOrderStatusResult {
  gatewayOrderId: string;
  gatewayPaymentId: string | null;

  externalReference: string | null;

  orderStatus: string | null;
  orderStatusDetail: string | null;

  paymentStatus: string | null;
  paymentStatusDetail: string | null;
}

export class MercadoPagoGateway {

    validateWebhookSignature(
  input: ValidateWebhookSignatureInput,
): void {
  if (
    !input.xSignature ||
    !input.xRequestId ||
    !input.dataId
  ) {
    throw new AppError(
      "Cabeçalhos do webhook não foram informados.",
      401,
      "INVALID_WEBHOOK_HEADERS",
    );
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: input.xSignature,
      xRequestId: input.xRequestId,
      dataId: input.dataId,
      secret: input.secret,
    });
  } catch (error) {
    if (
      error instanceof
      InvalidWebhookSignatureError
    ) {
      throw new AppError(
        "Assinatura do webhook inválida.",
        401,
        "INVALID_WEBHOOK_SIGNATURE",
      );
    }

    console.error(
      "Erro ao validar webhook do Mercado Pago:",
      error,
    );

    throw new AppError(
      "Não foi possível validar o webhook.",
      401,
      "WEBHOOK_VALIDATION_ERROR",
    );
  }
}

async getOrderById(
  gatewayOrderId: string,
): Promise<MercadoPagoOrderStatusResult> {
  try {
    const response =
      await mercadoPagoOrder.get({
        id: gatewayOrderId,
      });

    if (!response.id) {
      throw new AppError(
        "Mercado Pago não retornou a order.",
        502,
        "MERCADO_PAGO_ORDER_NOT_RETURNED",
      );
    }

    const payment =
      response.transactions
        ?.payments?.[0];

    return {
      gatewayOrderId: response.id,

      gatewayPaymentId:
        payment?.id ?? null,

      externalReference:
        response.external_reference ??
        null,

      orderStatus:
        response.status ?? null,

      orderStatusDetail:
        response.status_detail ?? null,

      paymentStatus:
        payment?.status ?? null,

      paymentStatusDetail:
        payment?.status_detail ?? null,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error(
      "Erro ao consultar order no Mercado Pago:",
      error,
    );

    throw new AppError(
      "Não foi possível consultar o pagamento no Mercado Pago.",
      502,
      "MERCADO_PAGO_ORDER_QUERY_ERROR",
    );
  }
}
  async createPixPayment(
    input: CreatePixPaymentInput,
  ): Promise<MercadoPagoPixResult> {
    const amount = (
      input.amountInCents / 100
    ).toFixed(2);

    const externalReference =
      `ORDER-${input.orderNumber}`;

    const isSandbox =
  env.MERCADO_PAGO_SANDBOX;
  
    const payerEmail = isSandbox
      ? "comprador@testuser.com"
      : input.payerEmail;

    const payerFirstName = isSandbox
      ? "APRO"
      : input.payerFirstName ?? "Cliente";

    try {
      const response =
        await mercadoPagoOrder.create({
          body: {
            type: "online",
            processing_mode: "automatic",
            total_amount: amount,
            external_reference:
              externalReference,

            payer: {
              email: payerEmail,
              first_name: payerFirstName,
            },

            transactions: {
              payments: [
                {
                  amount,

                  payment_method: {
                    id: "pix",
                    type: "bank_transfer",
                  },
                },
              ],
            },
          },

          requestOptions: {
            idempotencyKey: randomUUID(),
          },
        });

      const payment =
        response.transactions
          ?.payments?.[0];

      if (!response.id) {
        throw new AppError(
          "Mercado Pago não retornou o ID da ordem.",
          502,
        );
      }

      if (!payment?.id) {
        throw new AppError(
          "Mercado Pago não retornou o ID do pagamento.",
          502,
        );
      }

      const paymentMethod =
        payment.payment_method;

      if (!paymentMethod?.qr_code) {
        throw new AppError(
          "Mercado Pago não retornou o código PIX.",
          502,
        );
      }

      if (!paymentMethod.qr_code_base64) {
        throw new AppError(
          "Mercado Pago não retornou o QR Code PIX.",
          502,
        );
      }

      if (!paymentMethod.ticket_url) {
        throw new AppError(
          "Mercado Pago não retornou o link do PIX.",
          502,
        );
      }

      return {
        gatewayOrderId: response.id,
        gatewayPaymentId: payment.id,

        externalReference,

        status:
          payment.status ??
          "action_required",

        statusDetail:
          payment.status_detail ??
          null,

        ticketUrl:
          paymentMethod.ticket_url,

        qrCode:
          paymentMethod.qr_code,

        qrCodeBase64:
          paymentMethod.qr_code_base64,

        expiresAt:
          payment.date_of_expiration
            ? new Date(
                payment.date_of_expiration,
              )
            : null,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error(
        "Erro ao criar PIX no Mercado Pago:",
        error,
      );

      throw new AppError(
        "Não foi possível gerar o pagamento PIX.",
        502,
      );
    }
  }
}