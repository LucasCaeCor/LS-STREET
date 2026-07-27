import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  sendPaginated,
  sendSuccess,
} from "../../core/responses/api-response";

import type {
  CustomerPublicIdParams,
  ListAdminCustomersQuery,
  UpdateCustomerStatusBody,
} from "./admin-customer.schema";

import {
  AdminCustomerService,
} from "./admin-customer.service";

export class AdminCustomerController {
  constructor(
    private readonly service:
      AdminCustomerService,
  ) {}

  list = async (
    request: FastifyRequest<{
      Querystring:
        ListAdminCustomersQuery;
    }>,

    reply: FastifyReply,
  ) => {
    const result =
      await this.service.list(
        request.query,
      );

    return sendPaginated(
      reply,
      {
        data:
          result.customers,

        pagination:
          result.pagination,

        message:
          "Clientes encontrados com sucesso.",
      },
    );
  };

  summary = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const summary =
      await this.service
        .summary();

    return sendSuccess(
      reply,
      {
        data: {
          summary,
        },

        message:
          "Resumo de clientes carregado com sucesso.",
      },
    );
  };

  findByPublicId = async (
    request: FastifyRequest<{
      Params:
        CustomerPublicIdParams;
    }>,

    reply: FastifyReply,
  ) => {
    const customer =
      await this.service
        .findByPublicId(
          request.params
            .publicId,
        );

    return sendSuccess(
      reply,
      {
        data: {
          customer,
        },

        message:
          "Cliente encontrado com sucesso.",
      },
    );
  };

  updateStatus = async (
    request: FastifyRequest<{
      Params:
        CustomerPublicIdParams;

      Body:
        UpdateCustomerStatusBody;
    }>,

    reply: FastifyReply,
  ) => {
    const customer =
      await this.service
        .updateStatus(
          request.params
            .publicId,

          request.body,
        );

    return sendSuccess(
      reply,
      {
        data: {
          customer,
        },

        message:
          "Status do cliente atualizado com sucesso.",
      },
    );
  };
}