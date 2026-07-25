import type { FastifyPluginAsync } from "fastify";

import { errorResponseSchema } from "../../core/schemas/common.schema";
import { prisma } from "../../database/prisma";

import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

const authUserSchema = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },

    name: {
      type: "string",
    },

    email: {
      type: "string",
      format: "email",
    },

    phone: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    role: {
      type: "string",
      enum: ["ADMIN", "CUSTOMER"],
    },

    status: {
      type: "string",
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
    },

    emailVerified: {
      type: "boolean",
    },

    avatarUrl: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },
  },
} as const;

const authResponseSchema = {
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
        user: authUserSchema,

        accessToken: {
          type: "string",
        },
      },
    },
  },
} as const;

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new AuthRepository(prisma);
  const service = new AuthService(repository, fastify);
  const controller = new AuthController(service);

  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Cadastrar cliente",
        description: "Cria uma nova conta de cliente.",

        body: {
          type: "object",
          required: ["name", "email", "password"],

          properties: {
            name: {
              type: "string",
              minLength: 3,
              maxLength: 100,
            },

            email: {
              type: "string",
              format: "email",
            },

            password: {
              type: "string",
              minLength: 8,
              maxLength: 72,
            },

            phone: {
              type: "string",
            },
          },
        },

        response: {
          201: authResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.register,
  );

  fastify.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Realizar login",
        description:
          "Autentica o usuário e cria uma nova sessão.",

        body: {
          type: "object",
          required: ["email", "password"],

          properties: {
            email: {
              type: "string",
              format: "email",
            },

            password: {
              type: "string",
            },
          },
        },

        response: {
          200: authResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.login,
  );

  fastify.post(
    "/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Renovar sessão",
        description:
          "Utiliza o cookie de refresh token para gerar uma nova sessão.",

        response: {
          200: authResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.refresh,
  );

  fastify.post(
    "/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "Encerrar sessão",

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
                type: "null",
              },
            },
          },

          500: errorResponseSchema,
        },
      },
    },
    controller.logout,
  );

  fastify.get(
    "/me",
    {
      preHandler: [fastify.authenticate],

      schema: {
        tags: ["Auth"],
        summary: "Obter usuário autenticado",
        security: [
          {
            bearerAuth: [],
          },
        ],

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
                  user: authUserSchema,
                },
              },
            },
          },

          401: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    controller.me,
  );
};