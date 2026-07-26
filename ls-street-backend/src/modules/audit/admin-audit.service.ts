import {
  AppError,
} from "../../core/errors/app-error";

import {
  createPaginationMetadata,
} from "../../core/pagination/pagination";

import {
  AdminAuditRepository,
} from "./admin-audit.repository";

import type {
  ListAdminAuditQuery,
} from "./admin-audit.schema";

export class AdminAuditService {
  constructor(
    private readonly repository:
      AdminAuditRepository,
  ) {}

  async list(
    query:
      ListAdminAuditQuery,
  ) {
    const endDate =
      query.endDate
        ? new Date(
            query.endDate,
          )
        : undefined;

    if (endDate) {
      endDate.setHours(
        23,
        59,
        59,
        999,
      );
    }

    const result =
      await this.repository.list({
        page: query.page,
        limit: query.limit,

        search: query.search,

        action: query.action,
        entity: query.entity,

        userPublicId:
          query.userPublicId,

        startDate:
          query.startDate,

        endDate,

        sortOrder:
          query.sortOrder,
      });

    return {
      auditLogs:
        result.auditLogs,

      pagination:
        createPaginationMetadata(
          query.page,
          query.limit,
          result.totalItems,
        ),
    };
  }

  async findById(
    auditId: string,
  ) {
    const auditLog =
      await this.repository
        .findById(auditId);

    if (!auditLog) {
      throw new AppError(
        "Registro de auditoria não encontrado.",
        404,
        "AUDIT_LOG_NOT_FOUND",
      );
    }

    return auditLog;
  }

  async getSummary() {
    const result =
      await this.repository
        .getSummary();

    return {
      total:
        result.total,

      today:
        result.today,

      byAction:
        Object.fromEntries(
          result.byAction.map(
            (item) => [
              item.action,
              item._count._all,
            ],
          ),
        ),
    };
  }
}