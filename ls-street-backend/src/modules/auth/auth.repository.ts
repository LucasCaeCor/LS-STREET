import type { PrismaClient, User } from "@prisma/client";

interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
}

interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async createRefreshToken(data: CreateRefreshTokenData) {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });
  }

  async revokeRefreshToken(
    refreshTokenId: string,
    replacedBy?: string,
  ): Promise<void> {
    await this.prisma.refreshToken.update({
      where: {
        id: refreshTokenId,
      },
      data: {
        revokedAt: new Date(),
        replacedBy,
      },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async deleteExpiredRefreshTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}