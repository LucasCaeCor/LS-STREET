import type {
  AuditAction,
  Prisma,
} from "@prisma/client";

import type {
  FastifyPluginAsync,
  FastifyRequest,
} from "fastify";

import fp from "fastify-plugin";

import {
  prisma,
} from "../database/prisma";

interface AuthenticatedAdmin {
  sub?: string;
  role?: string;
}

const mutatingMethods = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

const sensitiveKeys = new Set([
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "tokenHash",
  "authorization",
  "cookie",
  "secret",
]);

function sanitizeJson(
  value: unknown,
): Prisma.InputJsonValue {
  try {
    const serialized = JSON.stringify(
      value,
      (key, currentValue) => {
        if (
          sensitiveKeys.has(
            key.toLowerCase(),
          )
        ) {
          return "[REDACTED]";
        }

        if (
          typeof currentValue ===
          "bigint"
        ) {
          return currentValue.toString();
        }

        if (
          Buffer.isBuffer(
            currentValue,
          )
        ) {
          return "[BINARY]";
        }

        return currentValue;
      },
    );

    if (!serialized) {
      return {
        value: null,
      };
    }

    return JSON.parse(
      serialized,
    ) as Prisma.InputJsonValue;
  } catch {
    return {
      value:
        "[UNSERIALIZABLE]",
    };
  }
}

function getRouteUrl(
  request: FastifyRequest,
) {
  return (
    request.routeOptions.url ??
    request.url.split("?")[0] ??
    request.url
  );
}

function getEntity(
  routeUrl: string,
): string {
  const parts = routeUrl
    .split("/")
    .filter(Boolean);

  const adminIndex =
    parts.indexOf("admin");

  if (adminIndex >= 0) {
    return (
      parts[adminIndex + 1] ??
      "unknown"
    );
  }

  return parts[0] ?? "unknown";
}

function getEntityId(
  params: unknown,
): string | undefined {
  if (
    !params ||
    typeof params !== "object"
  ) {
    return undefined;
  }

  const values =
    Object.entries(
      params as Record<
        string,
        unknown
      >,
    );

  const preferredValue =
    values.find(
      ([key, value]) =>
        key
          .toLowerCase()
          .includes("id") &&
        (
          typeof value ===
            "string" ||
          typeof value ===
            "number"
        ),
    )?.[1];

  const fallbackValue =
    values.find(
      ([, value]) =>
        typeof value ===
          "string" ||
        typeof value ===
          "number",
    )?.[1];

  const entityId =
    preferredValue ??
    fallbackValue;

  return entityId !== undefined
    ? String(entityId)
    : undefined;
}

function getAuditAction(
  method: string,
  routeUrl: string,
  entity: string,
): AuditAction {
  if (entity === "inventory") {
    return "STOCK_UPDATE";
  }

  if (
    entity === "payments"
  ) {
    return "PAYMENT_UPDATE";
  }

  if (
    routeUrl.includes(
      "/status",
    )
  ) {
    return "STATUS_CHANGE";
  }

  if (method === "POST") {
    return "CREATE";
  }

  if (
    method === "PUT" ||
    method === "PATCH"
  ) {
    return "UPDATE";
  }

  return "DELETE";
}

const auditPlugin:
  FastifyPluginAsync =
  async (fastify) => {
    fastify.addHook(
      "onSend",
      async (
        request,
        reply,
        payload,
      ) => {
        if (
          !mutatingMethods.has(
            request.method,
          )
        ) {
          return payload;
        }

        if (
          reply.statusCode >= 400
        ) {
          return payload;
        }

        let user:
          AuthenticatedAdmin |
          undefined;

        try {
          user =
            request.user as
              AuthenticatedAdmin;
        } catch {
          return payload;
        }

        if (
          user?.role !== "ADMIN" ||
          !user.sub
        ) {
          return payload;
        }

        const routeUrl =
          getRouteUrl(request);

        const entity =
          getEntity(routeUrl);

        const entityId =
          getEntityId(
            request.params,
          );

        const action =
          getAuditAction(
            request.method,
            routeUrl,
            entity,
          );

        const userAgentHeader =
          request.headers[
            "user-agent"
          ];

        const userAgent =
          Array.isArray(
            userAgentHeader,
          )
            ? userAgentHeader[0]
            : userAgentHeader;

        try {
          await prisma.auditLog.create({
            data: {
              action,
              entity,
              entityId,

              description:
                `${request.method} ${routeUrl}`,

              after:
                sanitizeJson({
                  method:
                    request.method,

                  route:
                    routeUrl,

                  params:
                    request.params,

                  query:
                    request.query,

                  body:
                    request.body,

                  statusCode:
                    reply.statusCode,
                }),

              ipAddress:
                request.ip,

              userAgent,

              user: {
                connect: {
                  id: user.sub,
                },
              },
            },
          });
        } catch (error) {
          request.log.error(
            {
              error,
              routeUrl,
            },
            "Não foi possível registrar a auditoria.",
          );
        }

        return payload;
      },
    );
  };

export default fp(
  auditPlugin,
  {
    name: "audit-plugin",

    dependencies: [
      "auth-plugin",
    ],
  },
);