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
  AdminAuditController,
} from "./admin-audit.controller";

import {
  AdminAuditRepository,
} from "./admin-audit.repository";

import {
  adminAuditParamsSchema,
  listAdminAuditQuerySchema,

  type AdminAuditParams,
  type ListAdminAuditQuery,
} from "./admin-audit.schema";

import {
  AdminAuditService,
} from "./admin-audit.service";

export async function adminAuditRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new AdminAuditRepository(
      prisma,
    );

  const service =
    new AdminAuditService(
      repository,
    );

  const controller =
    new AdminAuditController(
      service,
    );

  fastify.get(
    "/summary",
    {
      preHandler: [
        fastify.requireAdmin,
      ],
    },

    controller.summary,
  );

  fastify.get<{
    Querystring:
      ListAdminAuditQuery;
  }>(
    "/",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          query:
            listAdminAuditQuerySchema,
        }),
      ],
    },

    controller.list,
  );

  fastify.get<{
    Params:
      AdminAuditParams;
  }>(
    "/:auditId",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            adminAuditParamsSchema,
        }),
      ],
    },

    controller.findById,
  );
}