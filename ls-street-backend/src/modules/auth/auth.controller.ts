import type { FastifyReply, FastifyRequest } from "fastify";

import { env } from "../../config/env";
import { AppError } from "../../core/errors/app-error";

import {
  loginSchema,
  registerSchema,
} from "./auth.schema";
import { AuthService } from "./auth.service";

const REFRESH_COOKIE_NAME = "ls_street_refresh_token";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const parsedBody = registerSchema.safeParse(request.body);

    if (!parsedBody.success) {
      throw new AppError(
        "Os dados de cadastro são inválidos.",
        422,
        "VALIDATION_ERROR",
        parsedBody.error.flatten().fieldErrors,
      );
    }

    const result = await this.service.register(parsedBody.data);

    this.setRefreshTokenCookie(
      reply,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    return reply.status(201).send({
      success: true,
      message: "Usuário cadastrado com sucesso.",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  };

  login = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const parsedBody = loginSchema.safeParse(request.body);

    if (!parsedBody.success) {
      throw new AppError(
        "Os dados de login são inválidos.",
        422,
        "VALIDATION_ERROR",
        parsedBody.error.flatten().fieldErrors,
      );
    }

    const result = await this.service.login({
      ...parsedBody.data,
      userAgent: request.headers["user-agent"],
      ipAddress: request.ip,
    });

    this.setRefreshTokenCookie(
      reply,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    return reply.send({
      success: true,
      message: "Login realizado com sucesso.",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  };

  refresh = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new AppError(
        "Refresh token não encontrado.",
        401,
        "REFRESH_TOKEN_NOT_FOUND",
      );
    }

    const result = await this.service.refresh(
      refreshToken,
      request.headers["user-agent"],
      request.ip,
    );

    this.setRefreshTokenCookie(
      reply,
      result.refreshToken,
      result.refreshTokenExpiresAt,
    );

    return reply.send({
      success: true,
      message: "Sessão renovada com sucesso.",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  };

  logout = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      await this.service.logout(refreshToken);
    }

    this.clearRefreshTokenCookie(reply);

    return reply.send({
      success: true,
      message: "Logout realizado com sucesso.",
      data: null,
    });
  };

  me = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const user = await this.service.getCurrentUser(request.user.sub);

    return reply.send({
      success: true,
      message: "Usuário autenticado obtido com sucesso.",
      data: {
        user,
      },
    });
  };

  private setRefreshTokenCookie(
    reply: FastifyReply,
    refreshToken: string,
    expiresAt: Date,
  ): void {
    reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
      path: "/auth",
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      expires: expiresAt,
      domain: env.COOKIE_DOMAIN || undefined,
    });
  }

  private clearRefreshTokenCookie(reply: FastifyReply): void {
    reply.clearCookie(REFRESH_COOKIE_NAME, {
      path: "/auth",
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: "lax",
      domain: env.COOKIE_DOMAIN || undefined,
    });
  }
}