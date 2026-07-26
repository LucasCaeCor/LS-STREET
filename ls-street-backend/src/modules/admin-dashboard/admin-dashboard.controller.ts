import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  sendSuccess,
} from "../../core/responses/api-response";

import type {
  AdminDashboardQuery,
} from "./admin-dashboard.schema";

import {
  AdminDashboardService,
} from "./admin-dashboard.service";

export class AdminDashboardController {
  constructor(
    private readonly service:
      AdminDashboardService,
  ) {}

  summary = async (
    request: FastifyRequest<{
      Querystring:
        AdminDashboardQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const dashboard =
      await this.service
        .getSummary(
          request.query,
        );

    return sendSuccess(reply, {
      data: {
        dashboard,
      },

      message:
        "Dashboard carregado com sucesso.",
    });
  };
}