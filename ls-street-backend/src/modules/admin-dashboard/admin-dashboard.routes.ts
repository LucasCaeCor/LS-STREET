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
  AdminDashboardController,
} from "./admin-dashboard.controller";

import {
  AdminDashboardRepository,
} from "./admin-dashboard.repository";

import {
  adminDashboardQuerySchema,
  type AdminDashboardQuery,
} from "./admin-dashboard.schema";

import {
  AdminDashboardService,
} from "./admin-dashboard.service";

export async function adminDashboardRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new AdminDashboardRepository(
      prisma,
    );

  const service =
    new AdminDashboardService(
      repository,
    );

  const controller =
    new AdminDashboardController(
      service,
    );

  fastify.get<{
    Querystring:
      AdminDashboardQuery;
  }>(
    "/",
    {
      schema: {
        tags: [
          "Dashboard - Admin",
        ],

        summary:
          "Obter resumo administrativo",

        security: [
          {
            bearerAuth: [],
          },
        ],

        querystring: {
          type: "object",

          properties: {
            days: {
              type: "integer",
              minimum: 7,
              maximum: 90,
              default: 30,
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
            adminDashboardQuerySchema,
        }),
      ],
    },

    controller.summary,
  );
}