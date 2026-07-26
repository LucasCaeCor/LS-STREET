import type {
  FastifyInstance,
} from "fastify";

import { prisma } from "../../database/prisma";

import { OrderController } from "./order.controller";
import { OrderRepository } from "./order.repository";
import { OrderService } from "./order.service";
interface OrderNumberParams {
  number: string;
}
export async function orderRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new OrderRepository(prisma);

  const service =
    new OrderService(repository);

  const controller =
    new OrderController(service);

  fastify.get(
    "/",
    {
      preHandler: [
        fastify.authenticate,
      ],
    },
    controller.list.bind(controller),
  );

  fastify.get<{
  Params: OrderNumberParams;
}>(
    "/:number",
    {
      preHandler: [
        fastify.authenticate,
      ],
    },
    controller.findByNumber.bind(
      controller,
    ),
  );
}