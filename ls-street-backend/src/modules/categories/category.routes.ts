import type { FastifyPluginAsync } from "fastify";

import { validate } from "../../core/middlewares/validate";
import { errorResponseSchema } from "../../core/schemas/common.schema";
import { prisma } from "../../database/prisma";

import { CategoryController } from "./category.controller";
import { CategoryRepository } from "./category.repository";
import {
  categoryParamsSchema,
  categorySlugParamsSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
  type CategoryParams,
  type CategorySlugParams,
  type CreateCategoryBody,
  type ListCategoriesQuery,
  type UpdateCategoryBody,
  type UpdateCategoryStatusBody,
} from "./category.schema";
import { CategoryService } from "./category.service";

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }],
} as const;

const categorySchema = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },

    name: {
      type: "string",
    },

    slug: {
      type: "string",
    },

    description: nullableStringSchema,
    imageUrl: nullableStringSchema,

    isActive: {
      type: "boolean",
    },

    createdAt: {
      type: "string",
      format: "date-time",
    },

    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
} as const;

const categoryBodySchema = {
  type: "object",

  properties: {
    name: {
      type: "string",
      minLength: 2,
      maxLength: 80,
    },

    description: {
      anyOf: [{ type: "string", maxLength: 500 }, { type: "null" }],
    },

    imageUrl: {
      anyOf: [
        {
          type: "string",
          format: "uri",
        },
        {
          type: "null",
        },
      ],
    },

    imagePublicId: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
  },
} as const;

const categoryResponseSchema = {
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
        category: categorySchema,
      },
    },
  },
} as const;

const categoriesListResponseSchema = {
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
      items: categorySchema,
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
} as const;

const listCategoriesQueryJsonSchema = {
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

    sortOrder: {
      type: "string",
      enum: ["asc", "desc"],
      default: "asc",
    },

    isActive: {
      type: "boolean",
    },
  },
} as const;

const categoryIdParamsJsonSchema = {
  type: "object",
  required: ["id"],

  properties: {
    id: {
      type: "string",
    },
  },
} as const;

const categorySlugParamsJsonSchema = {
  type: "object",
  required: ["slug"],

  properties: {
    slug: {
      type: "string",
    },
  },
} as const;

export const categoryRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new CategoryRepository(prisma);
  const service = new CategoryService(repository);
  const controller = new CategoryController(service);

  fastify.get<{
    Querystring: ListCategoriesQuery;
  }>(
    "/",
    {
      preHandler: [
        validate({
          query: listCategoriesQuerySchema,
        }),
      ],

      schema: {
        tags: ["Categories"],
        summary: "Listar categorias ativas",

        querystring: listCategoriesQueryJsonSchema,

        response: {
          200: categoriesListResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.listPublic,
  );

  fastify.get<{
    Params: CategorySlugParams;
  }>(
    "/slug/:slug",
    {
      preHandler: [
        validate({
          params: categorySlugParamsSchema,
        }),
      ],

      schema: {
        tags: ["Categories"],
        summary: "Buscar categoria ativa pelo slug",

        params: categorySlugParamsJsonSchema,

        response: {
          200: categoryResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.findPublicBySlug,
  );

  fastify.get<{
    Querystring: ListCategoriesQuery;
  }>(
    "/admin",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          query: listCategoriesQuerySchema,
        }),
      ],

      schema: {
        tags: ["Categories"],
        summary: "Listar todas as categorias",
        security: [{ bearerAuth: [] }],

        querystring: listCategoriesQueryJsonSchema,

        response: {
          200: categoriesListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.listAdmin,
  );

  fastify.get<{
    Params: CategoryParams;
  }>(
    "/admin/:id",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params: categoryParamsSchema,
        }),
      ],

      schema: {
        tags: ["Categories"],
        summary: "Buscar categoria pelo ID",
        security: [{ bearerAuth: [] }],

        params: categoryIdParamsJsonSchema,

        response: {
          200: categoryResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.findById,
  );

  fastify.post<{
    Body: CreateCategoryBody;
  }>(
    "/admin",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          body: createCategorySchema,
        }),
      ],

      schema: {
        tags: ["Categories"],
        summary: "Criar categoria",
        security: [{ bearerAuth: [] }],

        body: {
          ...categoryBodySchema,
          required: ["name"],
        },

        response: {
          201: categoryResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.create,
  );

  fastify.put<{
    Params: CategoryParams;
    Body: UpdateCategoryBody;
  }>(
    "/admin/:id",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params: categoryParamsSchema,
          body: updateCategorySchema,
        }),
      ],

      schema: {
        tags: ["Categories"],
        summary: "Atualizar categoria",
        security: [{ bearerAuth: [] }],

        params: categoryIdParamsJsonSchema,
        body: categoryBodySchema,

        response: {
          200: categoryResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.update,
  );

  fastify.patch<{
    Params: CategoryParams;
    Body: UpdateCategoryStatusBody;
  }>(
    "/admin/:id/status",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params: categoryParamsSchema,
          body: updateCategoryStatusSchema,
        }),
      ],

      schema: {
        tags: ["Categories"],
        summary: "Ativar ou desativar categoria",
        security: [{ bearerAuth: [] }],

        params: categoryIdParamsJsonSchema,

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
          200: categoryResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.updateStatus,
  );
};