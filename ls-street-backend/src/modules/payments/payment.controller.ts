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
} from "./payment.schema";

import { PaymentService } from "./payment.service";

export class PaymentController {
  constructor(
    private readonly service:
      PaymentService,
  ) {}

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