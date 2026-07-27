import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  ImageIcon,
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
} from "react-router";

import {
  apiRequest,
} from "../lib/api";

import type {
  AdminFavoriteListItem,
  AdminFavoriteSummary,
  AdminFavoritesResponse,
  AdminFavoriteSummaryResponse,
} from "../types/admin-favorites";

import type {
  Pagination,
} from "../types/orders";

interface FavoriteFilters {
  search: string;

  sortOrder:
    | "asc"
    | "desc";
}

const initialFilters:
  FavoriteFilters = {
    search: "",
    sortOrder: "desc",
  };

const emptySummary:
  AdminFavoriteSummary = {
    totalFavorites: 0,
    customersWithFavorites: 0,
    productsFavorited: 0,
    favoritesLastThirtyDays: 0,
  };

const emptyPagination:
  Pagination = {
    page: 1,
    limit: 20,

    totalItems: 0,
    totalPages: 0,

    hasNextPage: false,
    hasPreviousPage: false,
  };

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function formatCustomerStatus(
  status:
    AdminFavoriteListItem[
      "customer"
    ]["status"],
) {
  const labels = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    BLOCKED: "Bloqueado",
  };

  return labels[status];
}

function formatProductStatus(
  status:
    AdminFavoriteListItem[
      "product"
    ]["status"],
) {
  const labels = {
    DRAFT: "Rascunho",
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    ARCHIVED: "Arquivado",
  };

  return labels[status];
}

function getStatusClass(
  status: string,
) {
  return status
    .toLowerCase()
    .replaceAll("_", "-");
}

function getInitials(
  name: string,
) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (words.length === 0) {
    return "C";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0].slice(0, 1) +
    words[
      words.length - 1
    ].slice(0, 1)
  ).toUpperCase();
}

export function AdminFavoritesPage() {
  const [
    favorites,
    setFavorites,
  ] = useState<
    AdminFavoriteListItem[]
  >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<AdminFavoriteSummary>(
      emptySummary,
    );

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
    draftFilters,
    setDraftFilters,
  ] =
    useState<FavoriteFilters>(
      initialFilters,
    );

  const [
    filters,
    setFilters,
  ] =
    useState<FavoriteFilters>(
      initialFilters,
    );

  const [
    loadingFavorites,
    setLoadingFavorites,
  ] = useState(true);

  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadSummary =
    useCallback(async () => {
      setLoadingSummary(true);

      try {
        const response =
          await apiRequest<
            AdminFavoriteSummaryResponse
          >(
            "/admin/favorites/summary",
          );

        setSummary(
          response.data.summary,
        );
      } catch (caughtError) {
        setSummary(
          emptySummary,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar o resumo de favoritos.",
        );
      } finally {
        setLoadingSummary(false);
      }
    }, []);

  const loadFavorites =
    useCallback(async () => {
      setLoadingFavorites(true);
      setError("");

      const query =
        new URLSearchParams();

      query.set(
        "page",
        String(page),
      );

      query.set(
        "limit",
        "20",
      );

      query.set(
        "sortOrder",
        filters.sortOrder,
      );

      if (filters.search) {
        query.set(
          "search",
          filters.search,
        );
      }

      try {
        const response =
          await apiRequest<
            AdminFavoritesResponse
          >(
            `/admin/favorites/?${query.toString()}`,
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
            Error
            ? caughtError.message
            : "Não foi possível carregar os favoritos.",
        );
      } finally {
        setLoadingFavorites(false);
      }
    }, [
      filters,
      page,
    ]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadSummary();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadSummary]);

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

  function applyFilters(
    event: FormEvent,
  ) {
    event.preventDefault();

    setPage(1);
    setError("");

    setFilters({
      ...draftFilters,

      search:
        draftFilters.search.trim(),
    });
  }

  function clearFilters() {
    setDraftFilters(
      initialFilters,
    );

    setFilters(
      initialFilters,
    );

    setPage(1);
    setError("");
  }

  async function reloadAll() {
    await Promise.all([
      loadSummary(),
      loadFavorites(),
    ]);
  }

  return (
    <div className="admin-favorites-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            INTERESSE DOS CLIENTES
          </span>

          <h1>Favoritos</h1>

          <p>
            Acompanhe quais produtos
            despertam mais interesse
            entre os clientes da loja.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          disabled={
            loadingFavorites ||
            loadingSummary
          }
          onClick={() => {
            void reloadAll();
          }}
        >
          <RefreshCw
            size={17}
            className={
              loadingFavorites ||
              loadingSummary
                ? "icon-spinning"
                : ""
            }
          />

          Atualizar
        </button>
      </header>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <section className="admin-favorite-summary-grid">
        <article>
          <Heart size={21} />

          <div>
            <span>
              Total de favoritos
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.totalFavorites}
            </strong>
          </div>
        </article>

        <article>
          <Users size={21} />

          <div>
            <span>
              Clientes interessados
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.customersWithFavorites}
            </strong>
          </div>
        </article>

        <article>
          <Package size={21} />

          <div>
            <span>
              Produtos favoritados
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.productsFavorited}
            </strong>
          </div>
        </article>

        <article>
          <CalendarDays
            size={21}
          />

          <div>
            <span>
              Últimos 30 dias
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.favoritesLastThirtyDays}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="admin-favorite-filter-panel"
        onSubmit={applyFilters}
      >
        <div className="admin-favorite-search-field">
          <Search size={17} />

          <input
            value={
              draftFilters.search
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  search:
                    event.target.value,
                }),
              )
            }
            placeholder="Cliente, e-mail, produto ou marca"
          />
        </div>

        <select
          value={
            draftFilters.sortOrder
          }
          onChange={(event) =>
            setDraftFilters(
              (current) => ({
                ...current,

                sortOrder:
                  event.target
                    .value as
                    | "asc"
                    | "desc",
              }),
            )
          }
        >
          <option value="desc">
            Mais recentes
          </option>

          <option value="asc">
            Mais antigos
          </option>
        </select>

        <div className="admin-favorite-filter-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={clearFilters}
          >
            Limpar
          </button>

          <button
            type="submit"
            className="compact-primary-button"
          >
            <Search size={17} />
            Filtrar
          </button>
        </div>
      </form>

      <section className="admin-favorites-panel">
        {loadingFavorites ? (
          <div className="admin-favorites-state">
            <LoaderCircle
              size={29}
              className="icon-spinning"
            />

            <span>
              Carregando favoritos...
            </span>
          </div>
        ) : favorites.length === 0 ? (
          <div className="admin-favorites-state">
            <Heart size={38} />

            <strong>
              Nenhum favorito
              encontrado.
            </strong>

            <span>
              Altere os filtros ou
              aguarde novos interesses
              dos clientes.
            </span>
          </div>
        ) : (
          <>
            <div className="admin-favorites-table-wrapper">
              <table className="admin-favorites-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Produto</th>
                    <th>Marca</th>
                    <th>Status do produto</th>
                    <th>Favoritado em</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {favorites.map(
                    (favorite) => (
                      <tr
                        key={
                          favorite.id
                        }
                      >
                        <td>
                          <div className="admin-favorite-customer-cell">
                            <div className="admin-favorite-avatar">
                              {getInitials(
                                favorite
                                  .customer
                                  .name,
                              )}
                            </div>

                            <section>
                              <strong>
                                {
                                  favorite
                                    .customer
                                    .name
                                }
                              </strong>

                              <span>
                                {
                                  favorite
                                    .customer
                                    .email
                                }
                              </span>

                              <small
                                className={`admin-favorite-customer-status ${getStatusClass(
                                  favorite
                                    .customer
                                    .status,
                                )}`}
                              >
                                {formatCustomerStatus(
                                  favorite
                                    .customer
                                    .status,
                                )}
                              </small>
                            </section>
                          </div>
                        </td>

                        <td>
                          <div className="admin-favorite-product-cell">
                            <div className="admin-favorite-product-image">
                              {favorite
                                .product
                                .image ? (
                                <img
                                  src={
                                    favorite
                                      .product
                                      .image
                                      .url
                                  }
                                  alt={
                                    favorite
                                      .product
                                      .image
                                      .altText ??
                                    favorite
                                      .product
                                      .name
                                  }
                                />
                              ) : (
                                <ImageIcon
                                  size={
                                    21
                                  }
                                />
                              )}
                            </div>

                            <section>
                              <strong>
                                {
                                  favorite
                                    .product
                                    .name
                                }
                              </strong>

                              <span>
                                ID:{" "}
                                {
                                  favorite
                                    .product
                                    .publicId
                                }
                              </span>
                            </section>
                          </div>
                        </td>

                        <td>
                          {favorite.product
                            .brand ??
                            "Não informada"}
                        </td>

                        <td>
                          <span
                            className={`admin-favorite-product-status ${getStatusClass(
                              favorite
                                .product
                                .status,
                            )}`}
                          >
                            {formatProductStatus(
                              favorite
                                .product
                                .status,
                            )}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            favorite.createdAt,
                          )}
                        </td>

                        <td>
                          <Link
                            to={`/produto/${favorite.product.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-favorite-open-product"
                            aria-label={`Abrir ${favorite.product.name}`}
                          >
                            <ExternalLink
                              size={17}
                            />
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <footer className="admin-favorites-pagination">
              <span>
                Mostrando{" "}
                {favorites.length} de{" "}
                {
                  pagination.totalItems
                }{" "}
                favoritos
              </span>

              <div>
                <button
                  type="button"
                  disabled={
                    !pagination
                      .hasPreviousPage ||
                    loadingFavorites
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          current - 1,
                          1,
                        ),
                    )
                  }
                >
                  <ChevronLeft
                    size={17}
                  />
                </button>

                <span>
                  Página{" "}
                  {pagination.page} de{" "}
                  {Math.max(
                    pagination.totalPages,
                    1,
                  )}
                </span>

                <button
                  type="button"
                  disabled={
                    !pagination
                      .hasNextPage ||
                    loadingFavorites
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1,
                    )
                  }
                >
                  <ChevronRight
                    size={17}
                  />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}