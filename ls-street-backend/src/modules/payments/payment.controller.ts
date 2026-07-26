import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  sendCreated,
  sendSuccess,
} from "../../core/responses/api-response";

import type {
  CreatePaymentBody,
  PaymentOrderNumberParams,
  MercadoPagoWebhookBody,
MercadoPagoWebhookQuery,
} from "./payment.schema";

import { PaymentService } from "./payment.service";

export class PaymentController {
  constructor(
    private readonly service:
      PaymentService,
  ) {}
webhook = async (
  request: FastifyRequest<{
    Querystring:
      MercadoPagoWebhookQuery;

    Body:
      MercadoPagoWebhookBody;
  }>,
  reply: FastifyReply,
) => {
  const signatureHeader =
    request.headers["x-signature"];

  const requestIdHeader =
    request.headers["x-request-id"];

  const xSignature =
    Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

  const xRequestId =
    Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : requestIdHeader;

  const dataId =
    request.query["data.id"] ??
    request.body?.data?.id;

  const type =
    request.query.type ??
    request.body?.type;

  const result =
    await this.service
      .processMercadoPagoWebhook({
        xSignature,
        xRequestId,
        dataId,
        type,
      });

  return reply.status(200).send({
    received: true,
    processed:
      result.processed,
    ignored:
      result.ignored,
  });
};
  create = async (
    request: FastifyRequest<{
      Params: PaymentOrderNumberParams;
      Body: CreatePaymentBody;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.create(
        request.user.sub,
        request.params.number,
        request.body,
      );

    if (result.reused) {
      return sendSuccess(reply, {
        data: {
          payment: result.payment,
          reused: true,
        },

        message:
          "Pagamento pendente encontrado.",
      });
    }

    return sendCreated(
      reply,
      {
        payment: result.payment,
        reused: false,
      },
      "Pagamento iniciado com sucesso.",
    );
  };

  findLatest = async (
    request: FastifyRequest<{
      Params: PaymentOrderNumberParams;
    }>,
    reply: FastifyReply,
  ) => {
    const payment =
      await this.service.findLatest(
        request.user.sub,
        request.params.number,
      );

    return sendSuccess(reply, {
      data: {
        payment,
      },

      message:
        "Pagamento encontrado com sucesso.",
    });
  };
}