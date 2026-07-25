import type { FastifyInstance } from "fastify";

import { env } from "../../config/env";
import { AppError } from "../../core/errors/app-error";
import {
  comparePassword,
  hashPassword,
} from "../../core/security/password";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../core/security/refresh-token";

import { AuthRepository } from "./auth.repository";
import type {
  AuthenticatedUser,
  CreateSessionInput,
  LoginInput,
  RegisterInput,
} from "./auth.types";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly fastify: FastifyInstance,
  ) {}

  async register(input: RegisterInput) {
    const email = input.email.trim().toLowerCase();

    const existingUser = await this.repository.findUserByEmail(email);

    if (existingUser) {
      throw new AppError(
        "Já existe um usuário cadastrado com este e-mail.",
        409,
        "EMAIL_ALREADY_EXISTS",
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await this.repository.createUser({
      name: input.name.trim(),
      email,
      passwordHash,
      phone: input.phone?.trim(),
    });

    const session = await this.createSession({
      userId: user.id,
    });

    return {
      user: this.toPublicUser(user),
      ...session,
    };
  }

  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();

    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      throw new AppError(
        "E-mail ou senha inválidos.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    if (user.status === "INACTIVE") {
      throw new AppError(
        "Esta conta está inativa.",
        403,
        "USER_INACTIVE",
      );
    }

    if (user.status === "BLOCKED") {
      throw new AppError(
        "Esta conta está bloqueada.",
        403,
        "USER_BLOCKED",
      );
    }

    const passwordMatches = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError(
        "E-mail ou senha inválidos.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const session = await this.createSession({
      userId: user.id,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    await this.repository.updateLastLogin(user.id);

    return {
      user: this.toPublicUser(user),
      ...session,
    };
  }

  async refresh(
    currentRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const currentTokenHash = hashRefreshToken(currentRefreshToken);

    const storedToken =
      await this.repository.findRefreshToken(currentTokenHash);

    if (!storedToken) {
      throw new AppError(
        "Refresh token inválido.",
        401,
        "INVALID_REFRESH_TOKEN",
      );
    }

    if (storedToken.revokedAt) {
      await this.repository.revokeAllUserRefreshTokens(storedToken.userId);

      throw new AppError(
        "O refresh token já foi utilizado ou revogado.",
        401,
        "REFRESH_TOKEN_REUSE_DETECTED",
      );
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      throw new AppError(
        "A sessão expirou. Faça login novamente.",
        401,
        "REFRESH_TOKEN_EXPIRED",
      );
    }

    if (storedToken.user.status !== "ACTIVE") {
      throw new AppError(
        "O usuário não está autorizado a acessar o sistema.",
        403,
        "USER_NOT_ACTIVE",
      );
    }

    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const expiresAt = this.getRefreshTokenExpiration();

    await this.repository.createRefreshToken({
      userId: storedToken.userId,
      tokenHash: newRefreshTokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    });

    await this.repository.revokeRefreshToken(
      storedToken.id,
      newRefreshTokenHash,
    );

    const accessToken = this.generateAccessToken({
      id: storedToken.user.id,
      publicId: storedToken.user.publicId,
      name: storedToken.user.name,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: expiresAt,
      user: this.toPublicUser(storedToken.user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.revokedAt) {
      return;
    }

    await this.repository.revokeRefreshToken(storedToken.id);
  }

  async getCurrentUser(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new AppError(
        "Usuário não encontrado.",
        404,
        "USER_NOT_FOUND",
      );
    }

    return this.toPublicUser(user);
  }

  private async createSession(input: CreateSessionInput) {
    const user = await this.repository.findUserById(input.userId);

    if (!user) {
      throw new AppError(
        "Usuário não encontrado.",
        404,
        "USER_NOT_FOUND",
      );
    }

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = this.getRefreshTokenExpiration();

    await this.repository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    const accessToken = this.generateAccessToken({
      id: user.id,
      publicId: user.publicId,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }

  private generateAccessToken(user: AuthenticatedUser): string {
    return this.fastify.jwt.sign(
      {
        sub: user.id,
        publicId: user.publicId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      },
    );
  }

  private getRefreshTokenExpiration(): Date {
    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS,
    );

    return expiresAt;
  }

  private toPublicUser(user: {
    id: string;
    publicId: string;
    name: string;
    email: string;
    phone: string | null;
    role: "ADMIN" | "CUSTOMER";
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    emailVerified: boolean;
    avatarUrl: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.publicId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}