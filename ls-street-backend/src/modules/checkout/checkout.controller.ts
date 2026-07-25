import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { CheckoutService } from "./checkout.service";

import {
  createCheckoutSchema,
} from "./checkout.schema";

export class CheckoutController {
  constructor(
    private readonly service: CheckoutService,
  ) {}

  async create(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const body = createCheckoutSchema.parse(
      request.body,
    );

    const order =
      await this.service.create(userId, body);

    return reply.status(201).send({
      success: true,
      message: "Pedido criado com sucesso.",
      data: {
        order,
      },
    });
  }
}