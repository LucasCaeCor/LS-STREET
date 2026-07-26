import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  apiRequest,
  removeAccessToken,
  setAccessToken,
} from "../lib/api";

import type {
  AuthResponse,
  AuthUser,
  CurrentUserResponse,
} from "../types/auth";

interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;

  login(
    input: LoginInput,
  ): Promise<AuthUser>;

  logout(): Promise<void>;
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadCurrentUser =
    useCallback(async () => {
      try {
        const response =
          await apiRequest<
            CurrentUserResponse
          >("/auth/me");

        setUser(response.data.user);
      } catch {
        setUser(null);
        removeAccessToken();
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  async function login(
    input: LoginInput,
  ) {
    const response =
      await apiRequest<AuthResponse>(
        "/auth/login",
        {
          method: "POST",

          body: JSON.stringify(
            input,
          ),

          retryOnUnauthorized:
            false,
        },
      );

    setAccessToken(
      response.data.accessToken,
    );

    setUser(response.data.user);

    return response.data.user;
  }

  async function logout() {
    try {
      await apiRequest(
        "/auth/logout",
        {
          method: "POST",
          retryOnUnauthorized:
            false,
        },
      );
    } finally {
      removeAccessToken();
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      authenticated:
        Boolean(user),
      login,
      logout,
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser usado dentro de AuthProvider.",
    );
  }

  return context;
}