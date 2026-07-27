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
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "./AuthContext";

import {
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  FavoritesResponse,
} from "../types/favorites";

interface FavoritesContextValue {
  favoriteCount: number;

  loading: boolean;
  error: string;

  isFavorite(
    productPublicId: string,
  ): boolean;

  isPending(
    productPublicId: string,
  ): boolean;

  toggleFavorite(
    productPublicId: string,
    redirectPath?: string,
  ): Promise<boolean | null>;

  refreshFavorites(): Promise<void>;

  clearError(): void;
}

const FavoritesContext =
  createContext<
    FavoritesContextValue | undefined
  >(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({
  children,
}: FavoritesProviderProps) {
  const navigate =
    useNavigate();

  const {
    user,
    loading: authLoading,
    authenticated,
  } = useAuth();

  const [
    favoriteProductIds,
    setFavoriteProductIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const [
    pendingProductIds,
    setPendingProductIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const [
    favoriteCount,
    setFavoriteCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const isCustomer =
    authenticated &&
    user?.role === "CUSTOMER";

  const refreshFavorites =
    useCallback(async () => {
      if (authLoading) {
        return;
      }

      if (!isCustomer) {
        setFavoriteProductIds(
          new Set(),
        );

        setPendingProductIds(
          new Set(),
        );

        setFavoriteCount(0);
        setError("");
        setLoading(false);

        return;
      }

      setLoading(true);
      setError("");

      try {
        const firstResponse =
          await apiRequest<
            FavoritesResponse
          >(
            "/favorites?page=1&limit=100&sortOrder=desc",
          );

        const allFavorites = [
          ...firstResponse.data,
        ];

        for (
          let page = 2;
          page <=
          firstResponse.pagination
            .totalPages;
          page += 1
        ) {
          const response =
            await apiRequest<
              FavoritesResponse
            >(
              `/favorites?page=${page}&limit=100&sortOrder=desc`,
            );

          allFavorites.push(
            ...response.data,
          );
        }

        setFavoriteProductIds(
          new Set(
            allFavorites.map(
              (favorite) =>
                favorite.product
                  .publicId,
            ),
          ),
        );

        setFavoriteCount(
          firstResponse.pagination
            .totalItems,
        );
      } catch (caughtError) {
        setFavoriteProductIds(
          new Set(),
        );

        setFavoriteCount(0);

        setError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível carregar seus favoritos.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      authLoading,
      isCustomer,
    ]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void refreshFavorites();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [refreshFavorites]);

  const isFavorite =
    useCallback(
      (
        productPublicId: string,
      ) =>
        favoriteProductIds.has(
          productPublicId,
        ),
      [favoriteProductIds],
    );

  const isPending =
    useCallback(
      (
        productPublicId: string,
      ) =>
        pendingProductIds.has(
          productPublicId,
        ),
      [pendingProductIds],
    );

  const toggleFavorite =
    useCallback(
      async (
        productPublicId: string,
        redirectPath = "/",
      ): Promise<
        boolean | null
      > => {
        if (authLoading) {
          return null;
        }

        if (!authenticated) {
          navigate(
            `/conta/entrar?redirect=${encodeURIComponent(
              redirectPath,
            )}`,
          );

          return null;
        }

        if (
          user?.role !==
          "CUSTOMER"
        ) {
          navigate("/admin");

          return null;
        }

        if (
          pendingProductIds.has(
            productPublicId,
          )
        ) {
          return null;
        }

        const currentlyFavorite =
          favoriteProductIds.has(
            productPublicId,
          );

        setPendingProductIds(
          (current) => {
            const next =
              new Set(current);

            next.add(
              productPublicId,
            );

            return next;
          },
        );

        setError("");

        try {
          if (currentlyFavorite) {
            await apiRequest<void>(
              `/favorites/${productPublicId}`,
              {
                method: "DELETE",
              },
            );

            setFavoriteProductIds(
              (current) => {
                const next =
                  new Set(current);

                next.delete(
                  productPublicId,
                );

                return next;
              },
            );

            setFavoriteCount(
              (current) =>
                Math.max(
                  0,
                  current - 1,
                ),
            );

            return false;
          }

          await apiRequest<unknown>(
            `/favorites/${productPublicId}`,
            {
              method: "POST",
            },
          );

          setFavoriteProductIds(
            (current) => {
              const next =
                new Set(current);

              next.add(
                productPublicId,
              );

              return next;
            },
          );

          setFavoriteCount(
            (current) =>
              current + 1,
          );

          return true;
        } catch (caughtError) {
          setError(
            caughtError instanceof
              ApiError
              ? caughtError.message
              : "Não foi possível alterar o favorito.",
          );

          return null;
        } finally {
          setPendingProductIds(
            (current) => {
              const next =
                new Set(current);

              next.delete(
                productPublicId,
              );

              return next;
            },
          );
        }
      },
      [
        authLoading,
        authenticated,
        user,
        navigate,
        pendingProductIds,
        favoriteProductIds,
      ],
    );

  const clearError =
    useCallback(() => {
      setError("");
    }, []);

  const value =
    useMemo(
      () => ({
        favoriteCount,

        loading,
        error,

        isFavorite,
        isPending,

        toggleFavorite,
        refreshFavorites,

        clearError,
      }),
      [
        favoriteCount,
        loading,
        error,
        isFavorite,
        isPending,
        toggleFavorite,
        refreshFavorites,
        clearError,
      ],
    );

  return (
    <FavoritesContext.Provider
      value={value}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const context =
    useContext(
      FavoritesContext,
    );

  if (!context) {
    throw new Error(
      "useFavorites deve ser usado dentro de FavoritesProvider.",
    );
  }

  return context;
}