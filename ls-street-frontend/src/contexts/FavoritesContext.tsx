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
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  FavoriteItem,
  FavoritesResponse,
} from "../types/favorites";

import {
  useAuth,
} from "./AuthContext";

interface FavoritesContextValue {
  favorites: FavoriteItem[];

  loading: boolean;
  error: string;

  totalFavorites: number;

  isFavorite(
    productPublicId: string,
  ): boolean;

  isToggling(
    productPublicId: string,
  ): boolean;

  refreshFavorites():
    Promise<void>;

  toggleFavorite(
    productPublicId: string,
  ): Promise<boolean>;
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
  const {
    user,
    loading: authLoading,
    authenticated,
  } = useAuth();

  const [
    favorites,
    setFavorites,
  ] = useState<FavoriteItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    togglingIds,
    setTogglingIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const isCustomer =
    authenticated &&
    user?.role === "CUSTOMER";

  const favoriteIds =
    useMemo(
      () =>
        new Set(
          favorites.map(
            (favorite) =>
              favorite.product
                .publicId,
          ),
        ),
      [favorites],
    );

  const refreshFavorites =
    useCallback(async () => {
      if (authLoading) {
        return;
      }

      if (!isCustomer) {
        setFavorites([]);
        setError("");
        setLoading(false);

        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await apiRequest<
            FavoritesResponse
          >(
            "/favorites?page=1&limit=100&sortOrder=desc",
          );

        setFavorites(
          response.data,
        );
      } catch (caughtError) {
        setFavorites([]);

        setError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível carregar os favoritos.",
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
        favoriteIds.has(
          productPublicId,
        ),
      [favoriteIds],
    );

  const isToggling =
    useCallback(
      (
        productPublicId: string,
      ) =>
        togglingIds.has(
          productPublicId,
        ),
      [togglingIds],
    );

  const toggleFavorite =
    useCallback(
      async (
        productPublicId: string,
      ) => {
        if (!isCustomer) {
          throw new ApiError(
            "Entre com uma conta de cliente para usar os favoritos.",
            401,
            "CUSTOMER_AUTH_REQUIRED",
          );
        }

        const currentlyFavorite =
          favoriteIds.has(
            productPublicId,
          );

        setTogglingIds(
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
              `/favorites/${encodeURIComponent(
                productPublicId,
              )}`,
              {
                method: "DELETE",
              },
            );

            setFavorites(
              (current) =>
                current.filter(
                  (favorite) =>
                    favorite.product
                      .publicId !==
                    productPublicId,
                ),
            );

            return false;
          }

          await apiRequest(
            `/favorites/${encodeURIComponent(
              productPublicId,
            )}`,
            {
              method: "POST",
            },
          );

          await refreshFavorites();

          return true;
        } catch (caughtError) {
          const message =
            caughtError instanceof
              ApiError
              ? caughtError.message
              : "Não foi possível alterar os favoritos.";

          setError(message);

          throw caughtError;
        } finally {
          setTogglingIds(
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
        favoriteIds,
        isCustomer,
        refreshFavorites,
      ],
    );

  const value =
    useMemo(
      () => ({
        favorites,
        loading,
        error,

        totalFavorites:
          favorites.length,

        isFavorite,
        isToggling,

        refreshFavorites,
        toggleFavorite,
      }),
      [
        favorites,
        loading,
        error,
        isFavorite,
        isToggling,
        refreshFavorites,
        toggleFavorite,
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