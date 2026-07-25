import type { UserRole } from "@prisma/client";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface CreateSessionInput {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthenticatedUser {
  id: string;
  publicId: string;
  name: string;
  email: string;
  role: UserRole;
}