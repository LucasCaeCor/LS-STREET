export type UserRole =
  | "ADMIN"
  | "CUSTOMER";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "BLOCKED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;

  role: UserRole;
  status: UserStatus;

  emailVerified: boolean;
  avatarUrl: string | null;

  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;

  data: {
    user: AuthUser;
    accessToken: string;
  };
}

export interface CurrentUserResponse {
  success: boolean;
  message: string;

  data: {
    user: AuthUser;
  };
}