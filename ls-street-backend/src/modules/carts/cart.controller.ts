import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { CartService } from "./cart.service";

import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
} from "./cart.schema";

export class CartController {
  constructor(
    private readonly service: CartService,
  ) {}

  async getCart(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const cart = await this.service.getCart(userId);

    return reply.status(200).send({
      success: true,
      data: cart,
    });
  }

  async addItem(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const body = addCartItemSchema.parse(
      request.body,
    );

    const cart = await this.service.addItem(
      userId,
      body,
    );

    return reply.status(201).send({
      success: true,
      message: "Item adicionado ao carrinho.",
      data: cart,
    });
  }

  async updateItem(
    request: FastifyRequest<{
      Params: { itemId: string };
    }>,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const { itemId } = cartItemParamsSchema.parse(
      request.params,
    );

    const body = updateCartItemSchema.parse(
      request.body,
    );

    const cart = await this.service.updateItem(
      userId,
      itemId,
      body,
    );

    return reply.send({
      success: true,
      message: "Carrinho atualizado.",
      data: cart,
    });
  }

  async removeItem(
    request: FastifyRequest<{
      Params: { itemId: string };
    }>,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const { itemId } = cartItemParamsSchema.parse(
      request.params,
    );

    const cart = await this.service.removeItem(
      userId,
      itemId,
    );

    return reply.send({
      success: true,
      message: "Item removido do carrinho.",
      data: cart,
    });
  }

  async clearCart(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const cart = await this.service.clearCart(
      userId,
    );

    return reply.send({
      success: true,
      message: "Carrinho limpo.",
      data: cart,
    });
  }
}