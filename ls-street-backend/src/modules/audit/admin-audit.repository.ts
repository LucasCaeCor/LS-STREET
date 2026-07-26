import {
  Prisma,
  type AuditAction,
  type PrismaClient,
} from "@prisma/client";

interface ListAuditFilters {
  page: number;
  limit: number;

  search?: string;

  action?: AuditAction;
  entity?: string;
  userPublicId?: string;

  startDate?: Date;
  endDate?: Date;

  sortOrder:
    | "asc"
    | "desc";
}

const auditSelect =
  Prisma.validator<
    Prisma.AuditLogSelect
  >()({
    id: true,

    action: true,
    entity: true,
    entityId: true,

    description: true,

    before: true,
    after: true,

    ipAddress: true,
    userAgent: true,

    createdAt: true,

    user: {
      select: {
        publicId: true,
        name: true,
        email: true,
        role: true,
      },
    },
  });

export class AdminAuditRepository {
  constructor(
    private readonly prisma:
      PrismaClient,
  ) {}

  async list(
    filters:
      ListAuditFilters,
  ) {
    const where:
      Prisma.AuditLogWhereInput =
      {};

    if (filters.action) {
      where.action =
        filters.action;
    }

    if (filters.entity) {
      where.entity = {
        contains:
          filters.entity,

        mode: "insensitive",
      };
    }

    if (
      filters.userPublicId
    ) {
      where.user = {
        publicId:
          filters.userPublicId,
      };
    }

    if (
      filters.startDate ||
      filters.endDate
    ) {
      where.createdAt = {
        ...(filters.startDate
          ? {
              gte:
                filters.startDate,
            }
          : {}),

        ...(filters.endDate
          ? {
              lte:
                filters.endDate,
            }
          : {}),
      };
    }

    if (filters.search) {
      where.OR = [
        {
          entity: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },

        {
          entityId: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },

        {
          description: {
            contains:
              filters.search,

            mode: "insensitive",
          },
        },

        {
          user: {
            name: {
              contains:
                filters.search,

              mode:
                "insensitive",
            },
          },
        },

        {
          user: {
            email: {
              contains:
                filters.search,

              mode:
                "insensitive",
            },
          },
        },
      ];
    }

    const skip =
      (filters.page - 1) *
      filters.limit;

    const [
      auditLogs,
      totalItems,
    ] =
      await this.prisma
        .$transaction([
          this.prisma
            .auditLog
            .findMany({
              where,

              skip,
              take:
                filters.limit,

              orderBy: {
                createdAt:
                  filters.sortOrder,
              },

              select:
                auditSelect,
            }),

          this.prisma
            .auditLog
            .count({
              where,
            }),
        ]);

    return {
      auditLogs,
      totalItems,
    };
  }

  async findById(
    auditId: string,
  ) {
    return this.prisma
      .auditLog
      .findUnique({
        where: {
          id: auditId,
        },

        select:
          auditSelect,
      });
  }

  async getSummary() {
    const startOfToday =
      new Date();

    startOfToday.setHours(
      0,
      0,
      0,
      0,
    );

    const [
      total,
      today,
      byAction,
    ] = await Promise.all([
      this.prisma
        .auditLog
        .count(),

      this.prisma
        .auditLog
        .count({
          where: {
            createdAt: {
              gte:
                startOfToday,
            },
          },
        }),

      this.prisma
        .auditLog
        .groupBy({
          by: ["action"],

          _count: {
            _all: true,
          },
        }),
    ]);

    return {
      total,
      today,
      byAction,
    };
  }
}