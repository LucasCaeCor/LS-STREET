import type {
  FastifyInstance,
} from "fastify";

import { prisma } from "../../database/prisma";
import { validate } from "../../plugins/validate";
import { MercadoPagoGateway } from
  "../../infra/payments/mercado-pago-gateway";

import { PaymentController } from "./payment.controller";
import { PaymentRepository } from "./payment.repository";

import {
  createPaymentSchema,
  paymentOrderNumberParamsSchema,
  type CreatePaymentBody,
  type PaymentOrderNumberParams,
} from "./payment.schema";

import { PaymentService } from "./payment.service";

export async function paymentRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new PaymentRepository(prisma);

  const mercadoPagoGateway =
    new MercadoPagoGateway();

    const service =
    new PaymentService(
        repository,
        mercadoPagoGateway,
    );

  const controller =
    new PaymentController(service);

  fastify.post<{
    Params: PaymentOrderNumberParams;
    Body: CreatePaymentBody;
  }>(
    "/:number/payment",
    {
      preHandler: [
        fastify.authenticate,

        validate({
          params:
            paymentOrderNumberParamsSchema,

          body:
            createPaymentSchema,
        }),
      ],
    },
    controller.create,
  );

  fastify.get<{
    Params: PaymentOrderNumberParams;
  }>(
    "/:number/payment",
    {
      preHandler: [
        fastify.authenticate,

        validate({
          params:
            paymentOrderNumberParamsSchema,
        }),
      ],
    },
    controller.findLatest,
  );
}