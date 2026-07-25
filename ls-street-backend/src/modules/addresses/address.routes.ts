import type { FastifyInstance } from "fastify";

import { prisma } from "../../database/prisma";

import { AddressRepository } from "./address.repository";
import { AddressService } from "./address.service";
import { AddressController } from "./address.controller";

export async function addressRoutes(
  fastify: FastifyInstance,
) {
  const repository = new AddressRepository(
    prisma,
  );

  const service = new AddressService(repository);

  const controller = new AddressController(
    service,
  );

  fastify.get(
    "/",
    {
      preHandler: [fastify.authenticate],
    },
    controller.list.bind(controller),
  );

  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate],
    },
    controller.create.bind(controller),
  );

  fastify.put(
    "/:addressId",
    {
      preHandler: [fastify.authenticate],
    },
    controller.update.bind(controller),
  );

  fastify.patch(
    "/:addressId/default",
    {
      preHandler: [fastify.authenticate],
    },
    controller.setDefault.bind(controller),
  );

  fastify.delete(
    "/:addressId",
    {
      preHandler: [fastify.authenticate],
    },
    controller.delete.bind(controller),
  );
}