import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
  LoaderCircle,
  PackageX,
  Trash2,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  useFavorites,
} from "../contexts/FavoritesContext";

import {
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  FavoriteItem,
  FavoritesResponse,
} from "../types/favorites";

import type {
  Pagination,
} from "../types/orders";

const emptyPagination:
  Pagination = {
    page: 1,
    limit: 12,

    totalItems: 0,
    totalPages: 0,

    hasNextPage: false,
    hasPreviousPage: false,
  };

function formatMoney(
  valueInCents: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(
    valueInCents / 100,
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "medium",
    },
  ).format(
    new Date(value),
  );
}

export function CustomerFavoritesPage() {
  const {
    error: favoriteError,

    isPending,
    toggleFavorite,
  } = useFavorites();

  const [
    favorites,
    setFavorites,
  ] = useState<
    FavoriteItem[]
  >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      emptyPagination,
    );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadFavorites =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await apiRequest<
            FavoritesResponse
          >(
            `/favorites?page=${page}&limit=12&sortOrder=desc`,
          );

        setFavorites(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setFavorites([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível carregar seus favoritos.",
        );
      } finally {
        setLoading(false);
      }
    }, [page]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadFavorites();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadFavorites]);

  async function removeFavorite(
    productPublicId: string,
  ) {
    const result =
      await toggleFavorite(
        productPublicId,
        "/minha-conta/favoritos",
      );

    if (result !== false) {
      return;
    }

    if (
      favorites.length === 1 &&
      page > 1
    ) {
      setPage(
        (current) =>
          Math.max(
            1,
            current - 1,
          ),
      );

      return;
    }

    await loadFavorites();
  }

  return (
    <section className="customer-favorites-page">
      <header className="customer-favorites-header">
        <div>
          <span>
            MINHA CONTA
          </span>

          <h1>
            Meus favoritos
          </h1>

          <p>
            Produtos que você guardou
            para encontrar novamente.
          </p>
        </div>

        <Link to="/minha-conta">
          <ArrowLeft size={18} />

          Voltar para minha conta
        </Link>
      </header>

      {(error ||
        favoriteError) && (
        <div className="customer-favorites-error">
          {error ||
            favoriteError}
        </div>
      )}

      {loading ? (
        <div className="customer-favorites-state">
          <LoaderCircle
            size={30}
            className="icon-spinning"
          />

          <span>
            Carregando favoritos...
          </span>
        </div>
      ) : favorites.length ===
        0 ? (
        <div className="customer-favorites-state">
          <Heart size={47} />

          <h2>
            Sua lista está vazia.
          </h2>

          <p>
            Toque no coração dos
            produtos que mais combinam
            com você.
          </p>

          <Link to="/">
            Explorar produtos
          </Link>
        </div>
      ) : (
        <>
          <div className="customer-favorites-grid">
            {favorites.map(
              (favorite) => {
                const {
                  product,
                } = favorite;

                const pending =
                  isPending(
                    product.publicId,
                  );

                const cheapestVariant =
                  product.variants[0] ??
                  null;

                const hasDiscount =
                  cheapestVariant
                    ?.compareAtPriceInCents !==
                    null &&
                  cheapestVariant
                    ?.compareAtPriceInCents !==
                    undefined &&
                  cheapestVariant
                    .compareAtPriceInCents >
                    cheapestVariant
                      .priceInCents;

                return (
                  <article
                    key={favorite.id}
                    className="customer-favorite-card"
                  >
                    <button
                      type="button"
                      className="customer-favorite-remove"
                      disabled={pending}
                      onClick={() => {
                        void removeFavorite(
                          product.publicId,
                        );
                      }}
                      aria-label={`Remover ${product.name} dos favoritos`}
                    >
                      {pending ? (
                        <LoaderCircle
                          size={18}
                          className="icon-spinning"
                        />
                      ) : (
                        <Trash2
                          size={18}
                        />
                      )}
                    </button>

                    <Link
                      to={`/produto/${product.slug}`}
                    >
                      <div className="customer-favorite-image">
                        {product.image ? (
                          <img
                            src={
                              product.image
                                .url
                            }
                            alt={
                              product.image
                                .altText ??
                              product.name
                            }
                          />
                        ) : (
                          <div>
                            <ImageIcon
                              size={35}
                            />

                            <span>
                              Sem imagem
                            </span>
                          </div>
                        )}

                        {!product.available && (
                          <span>
                            <PackageX
                              size={15}
                            />

                            Esgotado
                          </span>
                        )}
                      </div>

                      <section className="customer-favorite-content">
                        <span>
                          {
                            product.category
                              .name
                          }
                        </span>

                        <h2>
                          {product.name}
                        </h2>

                        <p>
                          {product.shortDescription ??
                            "Streetwear autêntico LS STREET."}
                        </p>

                        {product.brand && (
                          <small>
                            {product.brand}
                          </small>
                        )}

                        <footer>
                          <div>
                            {hasDiscount &&
                              cheapestVariant && (
                                <small>
                                  {formatMoney(
                                    cheapestVariant
                                      .compareAtPriceInCents!,
                                  )}
                                </small>
                              )}

                            <strong>
                              {product.minimumPriceInCents !==
                              null
                                ? formatMoney(
                                    product.minimumPriceInCents,
                                  )
                                : "Indisponível"}
                            </strong>
                          </div>

                          <span>
                            Favoritado em{" "}
                            {formatDate(
                              favorite.createdAt,
                            )}
                          </span>
                        </footer>
                      </section>
                    </Link>
                  </article>
                );
              },
            )}
          </div>

          <footer className="customer-favorites-pagination">
            <span>
              Página{" "}
              {pagination.page} de{" "}
              {Math.max(
                pagination.totalPages,
                1,
              )}
            </span>

            <div>
              <button
                type="button"
                disabled={
                  !pagination
                    .hasPreviousPage
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1,
                      ),
                  )
                }
              >
                <ChevronLeft
                  size={19}
                />
              </button>

              <button
                type="button"
                disabled={
                  !pagination
                    .hasNextPage
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1,
                  )
                }
              >
                <ChevronRight
                  size={19}
                />
              </button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}