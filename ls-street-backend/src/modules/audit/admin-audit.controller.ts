import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  AdminAuditParams,
  ListAdminAuditQuery,
} from "./admin-audit.schema";

import {
  AdminAuditService,
} from "./admin-audit.service";

export class AdminAuditController {
  constructor(
    private readonly service:
      AdminAuditService,
  ) {}

  list = async (
    request: FastifyRequest<{
      Querystring:
        ListAdminAuditQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.list(
        request.query,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Registros de auditoria listados com sucesso.",

        data:
          result.auditLogs,

        pagination:
          result.pagination,
      });
  };

  findById = async (
    request: FastifyRequest<{
      Params:
        AdminAuditParams;
    }>,
    reply: FastifyReply,
  ) => {
    const auditLog =
      await this.service
        .findById(
          request.params.auditId,
        );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Registro de auditoria encontrado com sucesso.",

        data: {
          auditLog,
        },
      });
  };

  summary = async (
    _request:
      FastifyRequest,
    reply: FastifyReply,
  ) => {
    const summary =
      await this.service
        .getSummary();

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Resumo da auditoria carregado com sucesso.",

        data: {
          summary,
        },
      });
  };
}