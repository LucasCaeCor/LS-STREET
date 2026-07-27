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
  useAuth,
} from "./AuthContext";

import {
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  StoreCart,
  StoreCartResponse,
} from "../types/cart";

interface CartContextValue {
  cart: StoreCart | null;

  loading: boolean;
  error: string;

  drawerOpen: boolean;

  openCart(): void;
  closeCart(): void;

  refreshCart(): Promise<void>;

  updateItem(
    itemId: string,
    quantity: number,
  ): Promise<void>;

  removeItem(
    itemId: string,
  ): Promise<void>;

  clearCart(): Promise<void>;
}

const CartContext =
  createContext<
    CartContextValue | undefined
  >(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const {
    user,
    loading: authLoading,
    authenticated,
  } = useAuth();

  const [
    cart,
    setCart,
  ] =
    useState<StoreCart | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const isCustomer =
    authenticated &&
    user?.role === "CUSTOMER";

  const refreshCart =
    useCallback(async () => {
      if (
        authLoading
      ) {
        return;
      }

      if (!isCustomer) {
        setCart(null);
        setError("");
        setLoading(false);
        setDrawerOpen(false);

        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await apiRequest<
            StoreCartResponse
          >("/cart");

        setCart(response.data);
      } catch (caughtError) {
        setCart(null);

        setError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível carregar o carrinho.",
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
        void refreshCart();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [refreshCart]);

  useEffect(() => {
    function handleCartUpdated(
      event: Event,
    ) {
      if (!isCustomer) {
        return;
      }

      const customEvent =
        event as CustomEvent<
          StoreCart
        >;

      if (!customEvent.detail) {
        return;
      }

      setCart(
        customEvent.detail,
      );

      setError("");
      setDrawerOpen(true);
    }

    window.addEventListener(
      "ls-street-cart-updated",
      handleCartUpdated,
    );

    return () => {
      window.removeEventListener(
        "ls-street-cart-updated",
        handleCartUpdated,
      );
    };
  }, [isCustomer]);

  const openCart =
    useCallback(() => {
      setDrawerOpen(true);
    }, []);

  const closeCart =
    useCallback(() => {
      setDrawerOpen(false);
    }, []);

  const updateItem =
    useCallback(
      async (
        itemId: string,
        quantity: number,
      ) => {
        setError("");

        try {
          const response =
            await apiRequest<
              StoreCartResponse
            >(
              `/cart/items/${itemId}`,
              {
                method: "PATCH",

                body: JSON.stringify({
                  quantity,
                }),
              },
            );

          setCart(
            response.data,
          );
        } catch (caughtError) {
          setError(
            caughtError instanceof
              ApiError
              ? caughtError.message
              : "Não foi possível alterar a quantidade.",
          );
        }
      },
      [],
    );

  const removeItem =
    useCallback(
      async (
        itemId: string,
      ) => {
        setError("");

        try {
          const response =
            await apiRequest<
              StoreCartResponse
            >(
              `/cart/items/${itemId}`,
              {
                method: "DELETE",
              },
            );

          setCart(
            response.data,
          );
        } catch (caughtError) {
          setError(
            caughtError instanceof
              ApiError
              ? caughtError.message
              : "Não foi possível remover o produto.",
          );
        }
      },
      [],
    );

  const clearCart =
    useCallback(async () => {
      setError("");

      try {
        const response =
          await apiRequest<
            StoreCartResponse
          >(
            "/cart",
            {
              method: "DELETE",
            },
          );

        setCart(
          response.data,
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível limpar o carrinho.",
        );
      }
    }, []);

  const value =
    useMemo(
      () => ({
        cart,
        loading,
        error,

        drawerOpen,

        openCart,
        closeCart,

        refreshCart,
        updateItem,
        removeItem,
        clearCart,
      }),
      [
        cart,
        loading,
        error,
        drawerOpen,
        openCart,
        closeCart,
        refreshCart,
        updateItem,
        removeItem,
        clearCart,
      ],
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart deve ser usado dentro de CartProvider.",
    );
  }

  return context;
}