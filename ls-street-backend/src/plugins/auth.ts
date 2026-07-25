import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { env } from "../config/env";
import { AppError } from "../core/errors/app-error";

interface JwtPayload {
  sub: string;
  publicId: string;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;

    requireAdmin: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cookie);

  await fastify.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  fastify.decorate("authenticate", async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(
        "Token de acesso inválido ou expirado.",
        401,
        "INVALID_ACCESS_TOKEN",
      );
    }
  });

  fastify.decorate("requireAdmin", async (request, reply) => {
    await fastify.authenticate(request, reply);

    if (request.user.role !== "ADMIN") {
      throw new AppError(
        "Você não possui permissão para acessar este recurso.",
        403,
        "ADMIN_PERMISSION_REQUIRED",
      );
    }
  });
};

export default fp(authPlugin, {
  name: "auth-plugin",
});