import type { FastifyInstance } from "fastify";

import { prisma } from "../../database/prisma";

import { CartRepository } from "./cart.repository";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
interface CartItemParams {
  itemId: string;
}

export async function cartRoutes(
  fastify: FastifyInstance,
) {
  const repository = new CartRepository(prisma);
  const service = new CartService(repository);
  const controller = new CartController(service);

  fastify.get(
    "/",
    {
      preHandler: [fastify.authenticate],
    },
    controller.getCart.bind(controller),
  );

  fastify.post(
    "/items",
    {
      preHandler: [fastify.authenticate],
    },
    controller.addItem.bind(controller),
  );

  fastify.patch<{
  Params: CartItemParams;
}>(
    "/items/:itemId",
    {
      preHandler: [fastify.authenticate],
    },
    controller.updateItem.bind(controller),
  );

  fastify.delete<{
  Params: CartItemParams;
}>(
    "/items/:itemId",
    {
      preHandler: [fastify.authenticate],
    },
    controller.removeItem.bind(controller),
  );

  fastify.delete(
    "/",
    {
      preHandler: [fastify.authenticate],
    },
    controller.clearCart.bind(controller),
  );
}