import type { FastifyInstance } from "fastify";

import { prisma } from "../../database/prisma";
import { validate } from "../../plugins/validate";

import { ProductVariantController } from "./product-variant.controller";
import { ProductVariantRepository } from "./product-variant.repository";
import {
  createProductVariantSchema,
  listProductVariantsQuerySchema,
  productVariantParamsSchema,
  productVariantProductParamsSchema,
  updateProductVariantSchema,
  updateProductVariantStatusSchema,
  type CreateProductVariantBody,
  type ListProductVariantsQuery,
  type ProductVariantParams,
  type ProductVariantProductParams,
  type UpdateProductVariantBody,
  type UpdateProductVariantStatusBody,
} from "./product-variant.schema";
import { ProductVariantService } from "./product-variant.service";

export async function productVariantRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new ProductVariantRepository(prisma);

  const service =
    new ProductVariantService(repository);

  const controller =
    new ProductVariantController(service);

  fastify.get<{
    Params: ProductVariantProductParams;
    Querystring: ListProductVariantsQuery;
  }>(
    "/products/admin/:productId/variants",
    {
      schema: {
        tags: ["Product Variants - Admin"],
        summary: "Listar variantes de um produto",
        description:
          "Retorna todas as variantes vinculadas a um produto para administração.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: {
              type: "string",
              description:
                "ID público do produto.",
            },
          },
        },

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
              description:
                "Pesquisa pelo SKU, cor ou tamanho.",
            },

            isActive: {
              type: "boolean",
            },

            lowStock: {
              type: "boolean",
            },

            sortBy: {
              type: "string",
              enum: [
                "sku",
                "priceInCents",
                "stock",
                "createdAt",
                "updatedAt",
              ],
              default: "createdAt",
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
            properties: {
              success: {
                type: "boolean",
              },

              message: {
                type: "string",
              },

              data: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                },
              },

              pagination: {
                type: "object",
                properties: {
                  page: {
                    type: "integer",
                  },

                  limit: {
                    type: "integer",
                  },

                  totalItems: {
                    type: "integer",
                  },

                  totalPages: {
                    type: "integer",
                  },

                  hasNextPage: {
                    type: "boolean",
                  },

                  hasPreviousPage: {
                    type: "boolean",
                  },
                },
              },
            },
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
            productVariantProductParamsSchema,

          query:
            listProductVariantsQuerySchema,
        }),
      ],
    },

    controller.listByProduct,
  );

  fastify.post<{
    Params: ProductVariantProductParams;
    Body: CreateProductVariantBody;
  }>(
    "/products/admin/:productId/variants",
    {
      schema: {
        tags: ["Product Variants - Admin"],
        summary: "Criar variante de produto",
        description:
          "Cria uma nova variante vinculada a um produto.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: {
              type: "string",
              description:
                "ID público do produto.",
            },
          },
        },

        body: {
          type: "object",
          required: [
            "sku",
            "priceInCents",
          ],

          properties: {
            sku: {
              type: "string",
              minLength: 2,
              maxLength: 100,
            },

            color: {
              type: "string",
              maxLength: 80,
            },

            size: {
              type: "string",
              maxLength: 30,
            },

            priceInCents: {
              type: "integer",
              minimum: 0,
            },

            compareAtPriceInCents: {
              anyOf: [
                {
                  type: "integer",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            costInCents: {
              anyOf: [
                {
                  type: "integer",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            stock: {
              type: "integer",
              minimum: 0,
              default: 0,
            },

            reservedStock: {
              type: "integer",
              minimum: 0,
              default: 0,
            },

            lowStockThreshold: {
              type: "integer",
              minimum: 0,
              default: 5,
            },

            barcode: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 100,
                },
                {
                  type: "null",
                },
              ],
            },

            weightInGrams: {
              anyOf: [
                {
                  type: "integer",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            height: {
              anyOf: [
                {
                  type: "number",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            width: {
              anyOf: [
                {
                  type: "number",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            length: {
              anyOf: [
                {
                  type: "number",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            isActive: {
              type: "boolean",
              default: true,
            },
          },
        },

        response: {
          201: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
              },

              message: {
                type: "string",
              },

              data: {
                type: "object",
                properties: {
                  variant: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
            },
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
            productVariantProductParamsSchema,

          body:
            createProductVariantSchema,
        }),
      ],
    },

    controller.create,
  );

  fastify.get<{
    Params: ProductVariantParams;
  }>(
    "/product-variants/admin/:id",
    {
      schema: {
        tags: ["Product Variants - Admin"],
        summary: "Buscar variante pelo ID",
        description:
          "Retorna os dados completos de uma variante para administração.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description:
                "ID público da variante.",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
              },

              message: {
                type: "string",
              },

              data: {
                type: "object",
                properties: {
                  variant: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
            },
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
            productVariantParamsSchema,
        }),
      ],
    },

    controller.findById,
  );

  fastify.put<{
    Params: ProductVariantParams;
    Body: UpdateProductVariantBody;
  }>(
    "/product-variants/admin/:id",
    {
      schema: {
        tags: ["Product Variants - Admin"],
        summary: "Atualizar variante",
        description:
          "Atualiza os dados principais de uma variante.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description:
                "ID público da variante.",
            },
          },
        },

        body: {
          type: "object",
          minProperties: 1,

          properties: {
            sku: {
              type: "string",
              minLength: 2,
              maxLength: 100,
            },

            color: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 80,
                },
                {
                  type: "null",
                },
              ],
            },

            size: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 30,
                },
                {
                  type: "null",
                },
              ],
            },

            priceInCents: {
              type: "integer",
              minimum: 0,
            },

            compareAtPriceInCents: {
              anyOf: [
                {
                  type: "integer",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            costInCents: {
              anyOf: [
                {
                  type: "integer",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            lowStockThreshold: {
              type: "integer",
              minimum: 0,
            },

            barcode: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 100,
                },
                {
                  type: "null",
                },
              ],
            },

            weightInGrams: {
              anyOf: [
                {
                  type: "integer",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            height: {
              anyOf: [
                {
                  type: "number",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            width: {
              anyOf: [
                {
                  type: "number",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            length: {
              anyOf: [
                {
                  type: "number",
                  minimum: 0,
                },
                {
                  type: "null",
                },
              ],
            },

            isActive: {
              type: "boolean",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
              },

              message: {
                type: "string",
              },

              data: {
                type: "object",
                properties: {
                  variant: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
            },
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
            productVariantParamsSchema,

          body:
            updateProductVariantSchema,
        }),
      ],
    },

    controller.update,
  );

  fastify.patch<{
    Params: ProductVariantParams;
    Body: UpdateProductVariantStatusBody;
  }>(
    "/product-variants/admin/:id/status",
    {
      schema: {
        tags: ["Product Variants - Admin"],
        summary:
          "Atualizar status da variante",
        description:
          "Ativa ou desativa uma variante de produto.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description:
                "ID público da variante.",
            },
          },
        },

        body: {
          type: "object",
          required: ["isActive"],
          properties: {
            isActive: {
              type: "boolean",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
              },

              message: {
                type: "string",
              },

              data: {
                type: "object",
                properties: {
                  variant: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
            },
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
            productVariantParamsSchema,

          body:
            updateProductVariantStatusSchema,
        }),
      ],
    },

    controller.updateStatus,
  );

  fastify.delete<{
    Params: ProductVariantParams;
  }>(
    "/product-variants/admin/:id",
    {
      schema: {
        tags: ["Product Variants - Admin"],
        summary: "Excluir variante",
        description:
          "Exclui uma variante que ainda não esteja vinculada a pedidos.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description:
                "ID público da variante.",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
              },

              message: {
                type: "string",
              },
            },
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
        },
      },

      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            productVariantParamsSchema,
        }),
      ],
    },

    controller.delete,
  );
}