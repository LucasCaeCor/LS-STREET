import type {
  FastifyInstance,
} from "fastify";

import {
  prisma,
} from "../../database/prisma";

import {
  validate,
} from "../../plugins/validate";

import {
  AdminPaymentController,
} from "./admin-payment.controller";

import {
  AdminPaymentRepository,
} from "./admin-payment.repository";

import {
  adminPaymentParamsSchema,
  listAdminPaymentsQuerySchema,

  type AdminPaymentParams,
  type ListAdminPaymentsQuery,
} from "./admin-payment.schema";

import {
  AdminPaymentService,
} from "./admin-payment.service";

export async function adminPaymentRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new AdminPaymentRepository(
      prisma,
    );

  const service =
    new AdminPaymentService(
      repository,
    );

  const controller =
    new AdminPaymentController(
      service,
    );

  fastify.get(
    "/summary",
    {
      schema: {
        tags: [
          "Payments - Admin",
        ],

        summary:
          "Obter resumo dos pagamentos",

        security: [
          {
            bearerAuth: [],
          },
        ],

        response: {
          200: {
            type: "object",
            additionalProperties: true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,
      ],
    },

    controller.summary,
  );

  fastify.get<{
    Querystring:
      ListAdminPaymentsQuery;
  }>(
    "/",
    {
      schema: {
        tags: [
          "Payments - Admin",
        ],

        summary:
          "Listar pagamentos",

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

            search: {
              type: "string",
            },

            status: {
              type: "string",

              enum: [
                "PENDING",
                "IN_PROCESS",
                "APPROVED",
                "REJECTED",
                "CANCELLED",
                "REFUNDED",
                "CHARGED_BACK",
              ],
            },

            method: {
              type: "string",

              enum: [
                "PIX",
                "CREDIT_CARD",
                "DEBIT_CARD",
                "BOLETO",
                "OTHER",
              ],
            },

            gateway: {
              type: "string",

              enum: [
                "MERCADO_PAGO",
              ],
            },

            startDate: {
              type: "string",
              format: "date-time",
            },

            endDate: {
              type: "string",
              format: "date-time",
            },

            sortOrder: {
              type: "string",

              enum: [
                "asc",
                "desc",
              ],

              default: "desc",
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties: true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          query:
            listAdminPaymentsQuerySchema,
        }),
      ],
    },

    controller.list,
  );

  fastify.get<{
    Params:
      AdminPaymentParams;
  }>(
    "/:paymentId",
    {
      schema: {
        tags: [
          "Payments - Admin",
        ],

        summary:
          "Obter detalhes de um pagamento",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",

          required: [
            "paymentId",
          ],

          properties: {
            paymentId: {
              type: "string",

              pattern:
                "^[a-fA-F0-9]{24}$",
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties: true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            adminPaymentParamsSchema,
        }),
      ],
    },

    controller.findById,
  );
}