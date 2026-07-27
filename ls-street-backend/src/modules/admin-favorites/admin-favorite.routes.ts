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
  AdminFavoriteController,
} from "./admin-favorite.controller";

import {
  AdminFavoriteRepository,
} from "./admin-favorite.repository";

import {
  listAdminFavoritesQuerySchema,
  type ListAdminFavoritesQuery,
} from "./admin-favorite.schema";

import {
  AdminFavoriteService,
} from "./admin-favorite.service";

export async function adminFavoriteRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new AdminFavoriteRepository(
      prisma,
    );

  const service =
    new AdminFavoriteService(
      repository,
    );

  const controller =
    new AdminFavoriteController(
      service,
    );

  fastify.get(
    "/summary",
    {
      schema: {
        tags: [
          "Favorites - Admin",
        ],

        summary:
          "Obter resumo de favoritos",

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
      ListAdminFavoritesQuery;
  }>(
    "/",
    {
      schema: {
        tags: [
          "Favorites - Admin",
        ],

        summary:
          "Listar favoritos",

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
            listAdminFavoritesQuerySchema,
        }),
      ],
    },

    controller.list,
  );
}