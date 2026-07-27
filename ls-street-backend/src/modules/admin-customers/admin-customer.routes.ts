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
  AdminCustomerController,
} from "./admin-customer.controller";

import {
  AdminCustomerRepository,
} from "./admin-customer.repository";

import {
  customerPublicIdParamsSchema,
  listAdminCustomersQuerySchema,
  updateCustomerStatusSchema,
  type CustomerPublicIdParams,
  type ListAdminCustomersQuery,
  type UpdateCustomerStatusBody,
} from "./admin-customer.schema";

import {
  AdminCustomerService,
} from "./admin-customer.service";

const customerStatusValues = [
  "ACTIVE",
  "INACTIVE",
  "BLOCKED",
];

export async function adminCustomerRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new AdminCustomerRepository(
      prisma,
    );

  const service =
    new AdminCustomerService(
      repository,
    );

  const controller =
    new AdminCustomerController(
      service,
    );

  fastify.get(
    "/summary",
    {
      schema: {
        tags: [
          "Customers - Admin",
        ],

        summary:
          "Obter resumo de clientes",

        security: [
          {
            bearerAuth: [],
          },
        ],

        response: {
          200: {
            type: "object",
            additionalProperties:
              true,
          },

          401: {
            type: "object",
            additionalProperties:
              true,
          },

          403: {
            type: "object",
            additionalProperties:
              true,
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
      ListAdminCustomersQuery;
  }>(
    "/",
    {
      schema: {
        tags: [
          "Customers - Admin",
        ],

        summary:
          "Listar clientes",

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
              minLength: 1,
              maxLength: 150,
            },

            status: {
              type: "string",

              enum:
                customerStatusValues,
            },

            emailVerified: {
              type: "string",

              enum: [
                "true",
                "false",
              ],
            },

            sortBy: {
              type: "string",

              enum: [
                "name",
                "createdAt",
                "lastLoginAt",
              ],

              default:
                "createdAt",
            },

            sortOrder: {
              type: "string",

              enum: [
                "asc",
                "desc",
              ],

              default:
                "desc",
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties:
              true,
          },

          401: {
            type: "object",
            additionalProperties:
              true,
          },

          403: {
            type: "object",
            additionalProperties:
              true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          query:
            listAdminCustomersQuerySchema,
        }),
      ],
    },

    controller.list,
  );

  fastify.get<{
    Params:
      CustomerPublicIdParams;
  }>(
    "/:publicId",
    {
      schema: {
        tags: [
          "Customers - Admin",
        ],

        summary:
          "Buscar detalhes do cliente",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",

          required: [
            "publicId",
          ],

          properties: {
            publicId: {
              type: "string",
              minLength: 10,
              maxLength: 50,
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties:
              true,
          },

          401: {
            type: "object",
            additionalProperties:
              true,
          },

          403: {
            type: "object",
            additionalProperties:
              true,
          },

          404: {
            type: "object",
            additionalProperties:
              true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            customerPublicIdParamsSchema,
        }),
      ],
    },

    controller.findByPublicId,
  );

  fastify.patch<{
    Params:
      CustomerPublicIdParams;

    Body:
      UpdateCustomerStatusBody;
  }>(
    "/:publicId/status",
    {
      schema: {
        tags: [
          "Customers - Admin",
        ],

        summary:
          "Atualizar status do cliente",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",

          required: [
            "publicId",
          ],

          properties: {
            publicId: {
              type: "string",
              minLength: 10,
              maxLength: 50,
            },
          },
        },

        body: {
          type: "object",

          required: [
            "status",
          ],

          additionalProperties:
            false,

          properties: {
            status: {
              type: "string",

              enum:
                customerStatusValues,
            },
          },
        },

        response: {
          200: {
            type: "object",
            additionalProperties:
              true,
          },

          401: {
            type: "object",
            additionalProperties:
              true,
          },

          403: {
            type: "object",
            additionalProperties:
              true,
          },

          404: {
            type: "object",
            additionalProperties:
              true,
          },

          409: {
            type: "object",
            additionalProperties:
              true,
          },
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            customerPublicIdParamsSchema,

          body:
            updateCustomerStatusSchema,
        }),
      ],
    },

    controller.updateStatus,
  );
}