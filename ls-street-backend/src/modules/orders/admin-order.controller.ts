import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  sendPaginated,
  sendSuccess,
} from "../../core/responses/api-response";

import type {
  ListAdminOrdersQuery,
  OrderNumberParams,
  UpdateOrderStatusBody,
} from "./order.schema";

import { OrderService } from "./order.service";

export class AdminOrderController {
  constructor(
    private readonly service: OrderService,
  ) {}

  list = async (
    request: FastifyRequest<{
      Querystring: ListAdminOrdersQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.listAdmin(
        request.query,
      );

    return sendPaginated(reply, {
      data: result.orders,
      pagination:
        result.pagination,

      message:
        "Pedidos encontrados com sucesso.",
    });
  };

  findByNumber = async (
    request: FastifyRequest<{
      Params: OrderNumberParams;
    }>,
    reply: FastifyReply,
  ) => {
    const order =
      await this.service.findAdminByNumber(
        request.params.number,
      );

    return sendSuccess(reply, {
      data: {
        order,
      },

      message:
        "Pedido encontrado com sucesso.",
    });
  };

  updateStatus = async (
    request: FastifyRequest<{
      Params: OrderNumberParams;
      Body: UpdateOrderStatusBody;
    }>,
    reply: FastifyReply,
  ) => {
    const order =
      await this.service.updateStatus(
        request.params.number,
        request.body,
      );

    return sendSuccess(reply, {
      data: {
        order,
      },

      message:
        "Status do pedido atualizado com sucesso.",
    });
  };
}