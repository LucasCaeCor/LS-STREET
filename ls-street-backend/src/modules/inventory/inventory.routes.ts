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
  InventoryController,
} from "./inventory.controller";

import {
  InventoryRepository,
} from "./inventory.repository";

import {
  adjustInventorySchema,
  inventoryVariantParamsSchema,
  listInventoryMovementsQuerySchema,

  type AdjustInventoryBody,
  type InventoryVariantParams,
  type ListInventoryMovementsQuery,
} from "./inventory.schema";

import {
  InventoryService,
} from "./inventory.service";

export async function inventoryRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new InventoryRepository(
      prisma,
    );

  const service =
    new InventoryService(
      repository,
    );

  const controller =
    new InventoryController(
      service,
    );

  fastify.post<{
    Params:
      InventoryVariantParams;

    Body:
      AdjustInventoryBody;
  }>(
    "/:variantId/adjust",
    {
      schema: {
        tags: [
          "Inventory - Admin",
        ],

        summary:
          "Ajustar estoque de variante",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: [
            "variantId",
          ],

          properties: {
            variantId: {
              type: "string",
            },
          },
        },

        body: {
          type: "object",

          required: [
            "type",
            "quantity",
          ],

          properties: {
            type: {
              type: "string",

              enum: [
                "INITIAL",
                "PURCHASE",
                "RETURN",
                "ADJUSTMENT",
                "CANCELLATION",
              ],
            },

            quantity: {
              type: "integer",
            },

            reason: {
              type: "string",
            },

            referenceId: {
              type: "string",
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
            inventoryVariantParamsSchema,

          body:
            adjustInventorySchema,
        }),
      ],
    },

    controller.adjust,
  );

  fastify.get<{
    Querystring:
      ListInventoryMovementsQuery;
  }>(
    "/movements",
    {
      schema: {
        tags: [
          "Inventory - Admin",
        ],

        summary:
          "Listar movimentações de estoque",

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

            variantId: {
              type: "string",
            },

            type: {
              type: "string",

              enum: [
                "INITIAL",
                "PURCHASE",
                "SALE",
                "RETURN",
                "ADJUSTMENT",
                "CANCELLATION",
              ],
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
            listInventoryMovementsQuerySchema,
        }),
      ],
    },

    controller.listMovements,
  );
}