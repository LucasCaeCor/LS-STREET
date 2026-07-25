import type { FastifyInstance } from "fastify";
import { prisma } from "../../database/prisma";
import { validate } from "../../plugins/validate";

import { ProductController } from "./product.controller";
import { ProductRepository } from "./product.repository";
import {
  createProductSchema,
  listProductsQuerySchema,
  productParamsSchema,
  productSlugParamsSchema,
  updateProductFeaturedSchema,
  updateProductSchema,
  updateProductStatusSchema,
  type CreateProductBody,
  type ListProductsQuery,
  type ProductParams,
  type ProductSlugParams,
  type UpdateProductBody,
  type UpdateProductFeaturedBody,
  type UpdateProductStatusBody,
} from "./product.schema";
import { ProductService } from "./product.service";

export async function productRoutes(
  fastify: FastifyInstance,
) {
  const repository = new ProductRepository(prisma);

  const service = new ProductService(repository);
  const controller = new ProductController(service);

  fastify.get<{
    Querystring: ListProductsQuery;
  }>(
    "/products",
    {
      schema: {
        tags: ["Products"],
        summary: "Listar produtos públicos",
        description:
          "Retorna produtos ativos, pertencentes a categorias ativas e com pelo menos uma variante ativa.",

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

            categoryId: {
              type: "string",
            },

            categorySlug: {
              type: "string",
            },

            brand: {
              type: "string",
            },

            isFeatured: {
              type: "boolean",
            },

            minPriceInCents: {
              type: "integer",
              minimum: 0,
            },

            maxPriceInCents: {
              type: "integer",
              minimum: 0,
            },

            sortBy: {
              type: "string",
              enum: [
                "name",
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
        },
      },

      preHandler: [
        validate({
          query: listProductsQuerySchema,
        }),
      ],
    },
    controller.listPublic,
  );

  fastify.get<{
    Params: ProductSlugParams;
  }>(
    "/products/:slug",
    {
      schema: {
        tags: ["Products"],
        summary: "Buscar produto pelo slug",
        description:
          "Retorna os dados públicos de um produto ativo.",

        params: {
          type: "object",
          required: ["slug"],
          properties: {
            slug: {
              type: "string",
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
                  product: {
                    type: "object",
                    additionalProperties: true,
                  },
                },
              },
            },
          },

          404: {
            type: "object",
            additionalProperties: true,
          },
        },
      },

      preHandler: [
        validate({
          params: productSlugParamsSchema,
        }),
      ],
    },
    controller.findPublicBySlug,
  );

  fastify.get<{
    Querystring: ListProductsQuery;
  }>(
    "/products/admin",
    {
      schema: {
        tags: ["Products - Admin"],
        summary: "Listar produtos para administração",
        description:
          "Retorna todos os produtos, incluindo rascunhos, inativos e arquivados.",

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

            categoryId: {
              type: "string",
            },

            categorySlug: {
              type: "string",
            },

            brand: {
              type: "string",
            },

            status: {
              type: "string",
              enum: [
                "DRAFT",
                "ACTIVE",
                "INACTIVE",
                "ARCHIVED",
              ],
            },

            isFeatured: {
              type: "boolean",
            },

            minPriceInCents: {
              type: "integer",
              minimum: 0,
            },

            maxPriceInCents: {
              type: "integer",
              minimum: 0,
            },

            sortBy: {
              type: "string",
              enum: [
                "name",
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
        },
      },

      preHandler: [
        fastify.requireAdmin,
        validate({
          query: listProductsQuerySchema,
        }),
      ],
    },
    controller.listAdmin,
  );

  fastify.get<{
    Params: ProductParams;
  }>(
    "/products/admin/:id",
    {
      schema: {
        tags: ["Products - Admin"],
        summary: "Buscar produto pelo ID",
        description:
          "Retorna os dados completos de um produto para administração.",

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
                  product: {
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
          params: productParamsSchema,
        }),
      ],
    },
    controller.findById,
  );

  fastify.post<{
    Body: CreateProductBody;
  }>(
    "/products/admin",
    {
      schema: {
        tags: ["Products - Admin"],
        summary: "Criar produto",
        description:
          "Cria um novo produto vinculado a uma categoria.",

        security: [
          {
            bearerAuth: [],
          },
        ],

        body: {
          type: "object",
          required: ["name", "categoryId"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 150,
            },

            slug: {
              type: "string",
              minLength: 2,
              maxLength: 180,
            },

            description: {
              type: "string",
              maxLength: 5000,
            },

            shortDescription: {
              type: "string",
              maxLength: 500,
            },

            brand: {
              type: "string",
              maxLength: 100,
            },

            status: {
              type: "string",
              enum: [
                "DRAFT",
                "ACTIVE",
                "INACTIVE",
                "ARCHIVED",
              ],
              default: "DRAFT",
            },

            isFeatured: {
              type: "boolean",
              default: false,
            },

            seoTitle: {
              type: "string",
              maxLength: 70,
            },

            seoDescription: {
              type: "string",
              maxLength: 160,
            },

            categoryId: {
              type: "string",
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
                  product: {
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
          body: createProductSchema,
        }),
      ],
    },
    controller.create,
  );

  fastify.put<{
    Params: ProductParams;
    Body: UpdateProductBody;
  }>(
    "/products/admin/:id",
    {
      schema: {
        tags: ["Products - Admin"],
        summary: "Atualizar produto",
        description:
          "Atualiza os dados principais de um produto.",

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
            },
          },
        },

        body: {
          type: "object",
          minProperties: 1,
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 150,
            },

            slug: {
              type: "string",
              minLength: 2,
              maxLength: 180,
            },

            description: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 5000,
                },
                {
                  type: "null",
                },
              ],
            },

            shortDescription: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 500,
                },
                {
                  type: "null",
                },
              ],
            },

            brand: {
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

            seoTitle: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 70,
                },
                {
                  type: "null",
                },
              ],
            },

            seoDescription: {
              anyOf: [
                {
                  type: "string",
                  maxLength: 160,
                },
                {
                  type: "null",
                },
              ],
            },

            categoryId: {
              type: "string",
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
                  product: {
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
          params: productParamsSchema,
          body: updateProductSchema,
        }),
      ],
    },
    controller.update,
  );

  fastify.patch<{
    Params: ProductParams;
    Body: UpdateProductStatusBody;
  }>(
    "/products/admin/:id/status",
    {
      schema: {
        tags: ["Products - Admin"],
        summary: "Atualizar status do produto",
        description:
          "Altera o status de um produto.",

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
                "DRAFT",
                "ACTIVE",
                "INACTIVE",
                "ARCHIVED",
              ],
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
                  product: {
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
          params: productParamsSchema,
          body: updateProductStatusSchema,
        }),
      ],
    },
    controller.updateStatus,
  );

  fastify.patch<{
    Params: ProductParams;
    Body: UpdateProductFeaturedBody;
  }>(
    "/products/admin/:id/featured",
    {
      schema: {
        tags: ["Products - Admin"],
        summary: "Atualizar destaque do produto",
        description:
          "Define se o produto deve aparecer como destaque.",

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
            },
          },
        },

        body: {
          type: "object",
          required: ["isFeatured"],
          properties: {
            isFeatured: {
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
                  product: {
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
          params: productParamsSchema,
          body: updateProductFeaturedSchema,
        }),
      ],
    },
    controller.updateFeatured,
  );

  fastify.delete<{
    Params: ProductParams;
  }>(
    "/products/admin/:id",
    {
      schema: {
        tags: ["Products - Admin"],
        summary: "Excluir produto",
        description:
          "Exclui um produto que ainda não esteja vinculado a pedidos.",

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
          params: productParamsSchema,
        }),
      ],
    },
    controller.delete,
  );
}