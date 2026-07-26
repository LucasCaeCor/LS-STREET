import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  AdminPaymentParams,
  ListAdminPaymentsQuery,
} from "./admin-payment.schema";

import {
  AdminPaymentService,
} from "./admin-payment.service";

export class AdminPaymentController {
  constructor(
    private readonly service:
      AdminPaymentService,
  ) {}

  list = async (
    request: FastifyRequest<{
      Querystring:
        ListAdminPaymentsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.list(
        request.query,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Pagamentos listados com sucesso.",

        data:
          result.payments,

        pagination:
          result.pagination,
      });
  };

  findById = async (
    request: FastifyRequest<{
      Params:
        AdminPaymentParams;
    }>,
    reply: FastifyReply,
  ) => {
    const payment =
      await this.service.findById(
        request.params.paymentId,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Pagamento encontrado com sucesso.",

        data: {
          payment,
        },
      });
  };

  summary = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const summary =
      await this.service
        .getSummary();

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Resumo de pagamentos carregado com sucesso.",

        data: {
          summary,
        },
      });
  };
}