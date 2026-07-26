import type {
  FastifyInstance,
} from "fastify";

import { prisma } from "../../database/prisma";
import { validate } from "../../plugins/validate";

import { AdminOrderController } from "./admin-order.controller";
import { OrderRepository } from "./order.repository";

import {
  listAdminOrdersQuerySchema,
  orderNumberParamsSchema,
  updateOrderStatusSchema,
  type ListAdminOrdersQuery,
  type OrderNumberParams,
  type UpdateOrderStatusBody,
} from "./order.schema";

import { OrderService } from "./order.service";

export async function adminOrderRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new OrderRepository(prisma);

  const service =
    new OrderService(repository);

  const controller =
    new AdminOrderController(service);

  fastify.get<{
    Querystring: ListAdminOrdersQuery;
  }>(
    "/",
    {
      schema: {
        tags: ["Orders - Admin"],

        summary:
          "Listar pedidos para administração",

        security: [
          {
            bearerAuth: [],
          },
        ],

        querystring: {
          type: "object",

          properties: {
            page: {
              type: "integer",
              minimum: 1,
              default: 1,
            },

            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },

            status: {
              type: "string",

              enum: [
                "PENDING_PAYMENT",
                "PAYMENT_IN_REVIEW",
                "PAID",
                "PREPARING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
                "REFUNDED",
              ],
            },

            number: {
              type: "integer",
              minimum: 1,
            },

            customer: {
              type: "string",
            },

            from: {
              type: "string",
              format: "date",
            },

            to: {
              type: "string",
              format: "date",
            },

            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties: true,
          },

          401: {
            type: "object",
            additionalProperties: true,
          },

          403: {
            type: "object",
            additionalProperties: true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          query:
            listAdminOrdersQuerySchema,
        }),
      ],
    },

    controller.list,
  );

  fastify.get<{
    Params: OrderNumberParams;
  }>(
    "/:number",
    {
      schema: {
        tags: ["Orders - Admin"],

        summary:
          "Buscar pedido pelo número",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["number"],

          properties: {
            number: {
              type: "integer",
              minimum: 1,
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties: true,
          },

          401: {
            type: "object",
            additionalProperties: true,
          },

          403: {
            type: "object",
            additionalProperties: true,
          },

          404: {
            type: "object",
            additionalProperties: true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            orderNumberParamsSchema,
        }),
      ],
    },

    controller.findByNumber,
  );

  fastify.patch<{
    Params: OrderNumberParams;
    Body: UpdateOrderStatusBody;
  }>(
    "/:number/status",
    {
      schema: {
        tags: ["Orders - Admin"],

        summary:
          "Atualizar status do pedido",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["number"],

          properties: {
            number: {
              type: "integer",
              minimum: 1,
            },
          },
        },

        body: {
          type: "object",
          required: ["status"],

          properties: {
            status: {
              type: "string",

              enum: [
                "PENDING_PAYMENT",
                "PAYMENT_IN_REVIEW",
                "PAID",
                "PREPARING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
                "REFUNDED",
              ],
            },

            trackingCode: {
              type: "string",
              minLength: 2,
              maxLength: 100,
            },

            trackingUrl: {
              type: "string",
              format: "uri",
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties: true,
          },

          401: {
            type: "object",
            additionalProperties: true,
          },

          403: {
            type: "object",
            additionalProperties: true,
          },

          404: {
            type: "object",
            additionalProperties: true,
          },

          409: {
            type: "object",
            additionalProperties: true,
          },

          422: {
            type: "object",
            additionalProperties: true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            orderNumberParamsSchema,

          body:
            updateOrderStatusSchema,
        }),
      ],
    },

    controller.updateStatus,
  );
}