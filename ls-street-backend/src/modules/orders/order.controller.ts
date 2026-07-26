import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  sendPaginated,
  sendSuccess,
} from "../../core/responses/api-response";

import {
  listOrdersQuerySchema,
  orderNumberParamsSchema,
} from "./order.schema";

import { OrderService } from "./order.service";

export class OrderController {
  constructor(
    private readonly service: OrderService,
  ) {}

  async list(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const query = listOrdersQuerySchema.parse(
      request.query,
    );

    const result = await this.service.list(
      userId,
      query,
    );

    return sendPaginated(reply, {
      data: result.orders,
      pagination: result.pagination,
      message: "Pedidos encontrados com sucesso.",
    });
  }

  async findByNumber(
    request: FastifyRequest<{
      Params: {
        number: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const { number } =
      orderNumberParamsSchema.parse(
        request.params,
      );

    const order =
      await this.service.findByNumber(
        userId,
        number,
      );

    return sendSuccess(reply, {
      data: {
        order,
      },
      message: "Pedido encontrado com sucesso.",
    });
  }
}