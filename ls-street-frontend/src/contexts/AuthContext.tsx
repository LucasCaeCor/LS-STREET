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

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthContextValue {
  user: AuthUser | null;

  loading: boolean;
  authenticated: boolean;

  login(
    input: LoginInput,
  ): Promise<AuthUser>;

  register(
    input: RegisterInput,
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
    useState<AuthUser | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const loadCurrentUser =
    useCallback(async () => {
      try {
        const response =
          await apiRequest<
            CurrentUserResponse
          >("/auth/me");

        setUser(
          response.data.user,
        );
      } catch {
        setUser(null);
        removeAccessToken();
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const login =
    useCallback(
      async (
        input: LoginInput,
      ) => {
        const response =
          await apiRequest<
            AuthResponse
          >(
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
          response.data
            .accessToken,
        );

        setUser(
          response.data.user,
        );

        return response.data.user;
      },
      [],
    );

  const register =
    useCallback(
      async (
        input: RegisterInput,
      ) => {
        const response =
          await apiRequest<
            AuthResponse
          >(
            "/auth/register",
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
          response.data
            .accessToken,
        );

        setUser(
          response.data.user,
        );

        return response.data.user;
      },
      [],
    );

  const logout =
    useCallback(async () => {
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
    }, []);

  const value = useMemo(
    () => ({
      user,
      loading,

      authenticated:
        Boolean(user),

      login,
      register,
      logout,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
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