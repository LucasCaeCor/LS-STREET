import { Prisma } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { AppError } from "../core/errors/app-error";

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn(
        {
          errorCode: error.code,
          statusCode: error.statusCode,
          method: request.method,
          url: request.url,
        },
        error.message,
      );

      return reply.status(error.statusCode).send({
        success: false,

        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      request.log.error(
        {
          prismaCode: error.code,
          method: request.method,
          url: request.url,
        },
        "Erro conhecido do Prisma",
      );

      if (error.code === "P2002") {
        return reply.status(409).send({
          success: false,

          error: {
            code: "UNIQUE_CONSTRAINT_ERROR",
            message: "Já existe um registro com estes dados.",
          },
        });
      }
    }

    request.log.error(
      {
        error,
        method: request.method,
        url: request.url,
      },
      "Erro interno não tratado",
    );

    return reply.status(500).send({
      success: false,

      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Ocorreu um erro interno no servidor.",
      },
    });
  });
};

export default fp(errorHandlerPlugin, {
  name: "error-handler-plugin",
});