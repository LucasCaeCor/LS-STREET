import type {
  FastifyInstance,
} from "fastify";

import { prisma } from "../../database/prisma";

import { CheckoutRepository } from "./checkout.repository";
import { CheckoutService } from "./checkout.service";
import { CheckoutController } from "./checkout.controller";

export async function checkoutRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new CheckoutRepository(prisma);

  const service =
    new CheckoutService(repository);

  const controller =
    new CheckoutController(service);

  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate],
    },
    controller.create.bind(controller),
  );
}