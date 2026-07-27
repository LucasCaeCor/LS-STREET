import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Heart,
  Home,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  apiRequest,
} from "../lib/api";

import type {
  OrderStatus,
  Pagination,
  PaymentMethod,
  PaymentStatus,
} from "../types/orders";

import type {
  AdminCustomerDetails,
  AdminCustomerListItem,
  CustomerDetailsResponse,
  CustomersResponse,
  CustomerStatus,
  CustomerSummary,
  CustomerSummaryResponse,
  UpdateCustomerStatusResponse,
} from "../types/customers";

interface CustomerFilters {
  search: string;

  status:
    | CustomerStatus
    | "";

  emailVerified:
    | ""
    | "true"
    | "false";

  sortBy:
    | "name"
    | "createdAt"
    | "lastLoginAt";

  sortOrder:
    | "asc"
    | "desc";
}

const initialFilters:
  CustomerFilters = {
    search: "",
    status: "",
    emailVerified: "",

    sortBy: "createdAt",
    sortOrder: "desc",
  };

const emptySummary:
  CustomerSummary = {
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
    verified: 0,
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

const customerStatuses:
  CustomerStatus[] = [
    "ACTIVE",
    "INACTIVE",
    "BLOCKED",
  ];

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
  value:
    | string
    | null,
) {
  if (!value) {
    return "Não informado";
  }

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
  status: CustomerStatus,
) {
  const labels: Record<
    CustomerStatus,
    string
  > = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    BLOCKED: "Bloqueado",
  };

  return labels[status];
}

function formatOrderStatus(
  status: OrderStatus,
) {
  const labels: Record<
    OrderStatus,
    string
  > = {
    PENDING_PAYMENT:
      "Aguardando pagamento",

    PAYMENT_IN_REVIEW:
      "Pagamento em análise",

    PAID: "Pago",
    PREPARING: "Em preparação",
    SHIPPED: "Enviado",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  };

  return labels[status];
}

function formatPaymentMethod(
  method: PaymentMethod,
) {
  const labels: Record<
    PaymentMethod,
    string
  > = {
    PIX: "PIX",

    CREDIT_CARD:
      "Cartão de crédito",

    DEBIT_CARD:
      "Cartão de débito",

    BOLETO: "Boleto",
    OTHER: "Outro",
  };

  return labels[method];
}

function formatPaymentStatus(
  status: PaymentStatus,
) {
  const labels: Record<
    PaymentStatus,
    string
  > = {
    PENDING: "Pendente",
    IN_PROCESS: "Em análise",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
    CHARGED_BACK: "Contestado",
  };

  return labels[status];
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

function getCustomerStatusClass(
  status: CustomerStatus,
) {
  return status.toLowerCase();
}

function getOrderStatusClass(
  status: OrderStatus,
) {
  return status
    .toLowerCase()
    .replaceAll("_", "-");
}

export function CustomersPage() {
  const [
    customers,
    setCustomers,
  ] = useState<
    AdminCustomerListItem[]
  >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<CustomerSummary>(
      emptySummary,
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      emptyPagination,
    );

  const [page, setPage] =
    useState(1);

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<CustomerFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<CustomerFilters>(
      initialFilters,
    );

  const [
    loadingCustomers,
    setLoadingCustomers,
  ] = useState(true);

  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] =
    useState<
      AdminCustomerDetails | null
    >(null);

  const [
    loadingDetails,
    setLoadingDetails,
  ] = useState(false);

  const [
    detailsError,
    setDetailsError,
  ] = useState("");

  const [
    changingStatus,
    setChangingStatus,
  ] = useState(false);

  const loadSummary =
    useCallback(async () => {
      setLoadingSummary(true);

      try {
        const response =
          await apiRequest<
            CustomerSummaryResponse
          >(
            "/admin/customers/summary",
          );

        setSummary(
          response.data.summary,
        );
      } catch (caughtError) {
        setSummary(emptySummary);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível carregar o resumo de clientes.",
        );
      } finally {
        setLoadingSummary(false);
      }
    }, []);

  const loadCustomers =
    useCallback(async () => {
      setLoadingCustomers(true);
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
        "sortBy",
        filters.sortBy,
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

      if (filters.status) {
        query.set(
          "status",
          filters.status,
        );
      }

      if (
        filters.emailVerified
      ) {
        query.set(
          "emailVerified",
          filters.emailVerified,
        );
      }

      try {
        const response =
          await apiRequest<
            CustomersResponse
          >(
            `/admin/customers/?${query.toString()}`,
          );

        setCustomers(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setCustomers([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível carregar os clientes.",
        );
      } finally {
        setLoadingCustomers(false);
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
        void loadCustomers();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadCustomers]);

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
      loadCustomers(),
    ]);
  }

  async function openDetails(
    customer:
      AdminCustomerListItem,
  ) {
    setLoadingDetails(true);
    setDetailsError("");

    setSelectedCustomer({
      id: customer.id,

      name: customer.name,
      email: customer.email,
      phone: customer.phone,

      avatarUrl:
        customer.avatarUrl,

      role: customer.role,
      status: customer.status,

      emailVerified:
        customer.emailVerified,

      lastLoginAt:
        customer.lastLoginAt,

      createdAt:
        customer.createdAt,

      updatedAt:
        customer.updatedAt,

      statistics: {
        ordersCount:
          customer.counts.orders,

        completedOrdersCount:
          0,

        totalSpentInCents:
          0,

        averageOrderInCents:
          0,

        addressesCount:
          customer.counts.addresses,

        favoritesCount:
          customer.counts.favorites,
      },

      addresses: [],
      recentOrders: [],
    });

    try {
      const response =
        await apiRequest<
          CustomerDetailsResponse
        >(
          `/admin/customers/${customer.id}`,
        );

      setSelectedCustomer(
        response.data.customer,
      );
    } catch (caughtError) {
      setDetailsError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível carregar os detalhes do cliente.",
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetails() {
    if (changingStatus) {
      return;
    }

    setSelectedCustomer(null);
    setDetailsError("");
  }

  async function updateStatus(
    status: CustomerStatus,
  ) {
    if (
      !selectedCustomer ||
      selectedCustomer.status ===
        status
    ) {
      return;
    }

    if (
      status === "BLOCKED"
    ) {
      const confirmed =
        window.confirm(
          `Bloquear o acesso de ${selectedCustomer.name}? Todas as sessões ativas serão encerradas.`,
        );

      if (!confirmed) {
        return;
      }
    }

    setChangingStatus(true);
    setDetailsError("");

    try {
      const response =
        await apiRequest<
          UpdateCustomerStatusResponse
        >(
          `/admin/customers/${selectedCustomer.id}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              status,
            }),
          },
        );

      const updated =
        response.data.customer;

      setCustomers(
        (currentCustomers) =>
          currentCustomers.map(
            (customer) =>
              customer.id ===
              updated.id
                ? updated
                : customer,
          ),
      );

      setSelectedCustomer(
        (currentCustomer) =>
          currentCustomer
            ? {
                ...currentCustomer,

                status:
                  updated.status,

                updatedAt:
                  updated.updatedAt,
              }
            : null,
      );

      setSuccessMessage(
        status === "ACTIVE"
          ? "Cliente ativado com sucesso."
          : status === "BLOCKED"
            ? "Cliente bloqueado e suas sessões foram encerradas."
            : "Cliente desativado e suas sessões foram encerradas.",
      );

      await loadSummary();
    } catch (caughtError) {
      setDetailsError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível alterar o status do cliente.",
      );
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div className="customers-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            RELACIONAMENTO
          </span>

          <h1>Clientes</h1>

          <p>
            Consulte cadastros,
            compras, endereços e
            controle o acesso à loja.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            void reloadAll();
          }}
          disabled={
            loadingCustomers ||
            loadingSummary
          }
        >
          <RefreshCw
            size={17}
            className={
              loadingCustomers ||
              loadingSummary
                ? "icon-spinning"
                : ""
            }
          />

          Atualizar
        </button>
      </header>

      {successMessage && (
        <div className="category-success-message">
          <CheckCircle2
            size={18}
          />

          <span>
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <section className="customer-summary-grid">
        <article>
          <Users size={21} />

          <div>
            <span>
              Total de clientes
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.total}
            </strong>
          </div>
        </article>

        <article>
          <CheckCircle2
            size={21}
          />

          <div>
            <span>Ativos</span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.active}
            </strong>
          </div>
        </article>

        <article>
          <Clock3 size={21} />

          <div>
            <span>Inativos</span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.inactive}
            </strong>
          </div>
        </article>

        <article
          className={
            summary.blocked > 0
              ? "customer-summary-warning"
              : ""
          }
        >
          <Ban size={21} />

          <div>
            <span>Bloqueados</span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.blocked}
            </strong>
          </div>
        </article>

        <article>
          <BadgeCheck
            size={21}
          />

          <div>
            <span>
              E-mails verificados
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.verified}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="customers-filter-panel"
        onSubmit={applyFilters}
      >
        <div className="customer-search-field">
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
                    event.target
                      .value,
                }),
              )
            }
            placeholder="Nome, e-mail, telefone ou ID"
          />
        </div>

        <select
          value={
            draftFilters.status
          }
          onChange={(event) =>
            setDraftFilters(
              (current) => ({
                ...current,

                status:
                  event.target
                    .value as
                    | CustomerStatus
                    | "",
              }),
            )
          }
        >
          <option value="">
            Todos os status
          </option>

          {customerStatuses.map(
            (status) => (
              <option
                value={status}
                key={status}
              >
                {formatCustomerStatus(
                  status,
                )}
              </option>
            ),
          )}
        </select>

        <select
          value={
            draftFilters
              .emailVerified
          }
          onChange={(event) =>
            setDraftFilters(
              (current) => ({
                ...current,

                emailVerified:
                  event.target
                    .value as
                    CustomerFilters["emailVerified"],
              }),
            )
          }
        >
          <option value="">
            Todos os e-mails
          </option>

          <option value="true">
            E-mail verificado
          </option>

          <option value="false">
            Não verificado
          </option>
        </select>

        <select
          value={
            draftFilters.sortBy
          }
          onChange={(event) =>
            setDraftFilters(
              (current) => ({
                ...current,

                sortBy:
                  event.target
                    .value as
                    CustomerFilters["sortBy"],
              }),
            )
          }
        >
          <option value="createdAt">
            Data de cadastro
          </option>

          <option value="name">
            Nome
          </option>

          <option value="lastLoginAt">
            Último acesso
          </option>
        </select>

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
            Decrescente
          </option>

          <option value="asc">
            Crescente
          </option>
        </select>

        <div className="customer-filter-actions">
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

      <section className="customers-panel">
        {loadingCustomers ? (
          <div className="customers-state">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            Carregando clientes...
          </div>
        ) : customers.length === 0 ? (
          <div className="customers-state">
            <Users size={36} />

            <strong>
              Nenhum cliente
              encontrado.
            </strong>

            <span>
              Altere os filtros ou
              aguarde novos cadastros.
            </span>
          </div>
        ) : (
          <div className="customers-table-wrapper">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Cadastro</th>
                  <th>Atividade</th>
                  <th>Último pedido</th>
                  <th>Último acesso</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {customers.map(
                  (customer) => (
                    <tr
                      key={customer.id}
                    >
                      <td>
                        <div className="customer-profile-cell">
                          <div className="customer-avatar">
                            {customer.avatarUrl ? (
                              <img
                                src={
                                  customer.avatarUrl
                                }
                                alt={
                                  customer.name
                                }
                              />
                            ) : (
                              <span>
                                {getInitials(
                                  customer.name,
                                )}
                              </span>
                            )}
                          </div>

                          <section>
                            <strong>
                              {customer.name}
                            </strong>

                            <span>
                              {customer.email}
                            </span>

                            <small>
                              {customer.phone ??
                                "Telefone não informado"}
                            </small>
                          </section>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`customer-status customer-status-${getCustomerStatusClass(
                            customer.status,
                          )}`}
                        >
                          {formatCustomerStatus(
                            customer.status,
                          )}
                        </span>

                        <span
                          className={
                            customer.emailVerified
                              ? "customer-verification verified"
                              : "customer-verification"
                          }
                        >
                          {customer.emailVerified ? (
                            <BadgeCheck
                              size={14}
                            />
                          ) : (
                            <Mail
                              size={14}
                            />
                          )}

                          {customer.emailVerified
                            ? "Verificado"
                            : "Não verificado"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatDate(
                            customer.createdAt,
                          )}
                        </strong>

                        <span>
                          ID:{" "}
                          {customer.id}
                        </span>
                      </td>

                      <td>
                        <div className="customer-counts">
                          <span>
                            <ShoppingBag
                              size={14}
                            />

                            {
                              customer.counts
                                .orders
                            }{" "}
                            pedidos
                          </span>

                          <span>
                            <Home
                              size={14}
                            />

                            {
                              customer.counts
                                .addresses
                            }{" "}
                            endereços
                          </span>

                          <span>
                            <Heart
                              size={14}
                            />

                            {
                              customer.counts
                                .favorites
                            }{" "}
                            favoritos
                          </span>
                        </div>
                      </td>

                      <td>
                        {customer.latestOrder ? (
                          <div className="customer-latest-order">
                            <strong>
                              Pedido #
                              {
                                customer
                                  .latestOrder
                                  .number
                              }
                            </strong>

                            <span
                              className={`customer-order-status customer-order-status-${getOrderStatusClass(
                                customer
                                  .latestOrder
                                  .status,
                              )}`}
                            >
                              {formatOrderStatus(
                                customer
                                  .latestOrder
                                  .status,
                              )}
                            </span>

                            <small>
                              {formatMoney(
                                customer
                                  .latestOrder
                                  .totalInCents,
                              )}
                            </small>
                          </div>
                        ) : (
                          <span className="customer-empty-value">
                            Nenhum pedido
                          </span>
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatDate(
                            customer.lastLoginAt,
                          )}
                        </strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="customer-details-button"
                          onClick={() => {
                            void openDetails(
                              customer,
                            );
                          }}
                        >
                          <Eye size={16} />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loadingCustomers &&
          pagination.totalItems >
            0 && (
            <footer className="pagination-footer">
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
                  className="pagination-button"
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
                    size={18}
                  />
                </button>

                <button
                  type="button"
                  className="pagination-button"
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
                    size={18}
                  />
                </button>
              </div>
            </footer>
          )}
      </section>

      {selectedCustomer && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeDetails
          }
        >
          <section
            className="customer-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="customer-details-header">
              <div>
                <span className="eyebrow">
                  CLIENTE
                </span>

                <h2>
                  {
                    selectedCustomer.name
                  }
                </h2>

                <p>
                  {
                    selectedCustomer.email
                  }
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={
                  closeDetails
                }
                disabled={
                  changingStatus
                }
              >
                <X size={21} />
              </button>
            </header>

            <div className="customer-details-content">
              {detailsError && (
                <div className="form-error">
                  {detailsError}
                </div>
              )}

              {loadingDetails ? (
                <div className="customers-state">
                  <LoaderCircle
                    size={28}
                    className="icon-spinning"
                  />

                  Carregando detalhes...
                </div>
              ) : (
                <>
                  <section className="customer-detail-hero">
                    <div className="customer-detail-avatar">
                      {selectedCustomer.avatarUrl ? (
                        <img
                          src={
                            selectedCustomer.avatarUrl
                          }
                          alt={
                            selectedCustomer.name
                          }
                        />
                      ) : (
                        <span>
                          {getInitials(
                            selectedCustomer.name,
                          )}
                        </span>
                      )}
                    </div>

                    <div className="customer-detail-identity">
                      <h3>
                        {
                          selectedCustomer.name
                        }
                      </h3>

                      <span>
                        {
                          selectedCustomer.email
                        }
                      </span>

                      <small>
                        {selectedCustomer.phone ??
                          "Telefone não informado"}
                      </small>
                    </div>

                    <span
                      className={`customer-status customer-status-${getCustomerStatusClass(
                        selectedCustomer.status,
                      )}`}
                    >
                      {formatCustomerStatus(
                        selectedCustomer.status,
                      )}
                    </span>
                  </section>

                  <section className="customer-detail-summary">
                    <article>
                      <ShoppingBag
                        size={19}
                      />

                      <span>
                        Pedidos
                      </span>

                      <strong>
                        {
                          selectedCustomer
                            .statistics
                            .ordersCount
                        }
                      </strong>
                    </article>

                    <article>
                      <PackageCheck
                        size={19}
                      />

                      <span>
                        Concluídos
                      </span>

                      <strong>
                        {
                          selectedCustomer
                            .statistics
                            .completedOrdersCount
                        }
                      </strong>
                    </article>

                    <article>
                      <BadgeCheck
                        size={19}
                      />

                      <span>
                        Total gasto
                      </span>

                      <strong>
                        {formatMoney(
                          selectedCustomer
                            .statistics
                            .totalSpentInCents,
                        )}
                      </strong>
                    </article>

                    <article>
                      <ShoppingBag
                        size={19}
                      />

                      <span>
                        Ticket médio
                      </span>

                      <strong>
                        {formatMoney(
                          selectedCustomer
                            .statistics
                            .averageOrderInCents,
                        )}
                      </strong>
                    </article>
                  </section>

                  <section className="customer-detail-section">
                    <div className="customer-section-title">
                      <UserRound
                        size={19}
                      />

                      <h3>
                        Dados do cadastro
                      </h3>
                    </div>

                    <div className="customer-info-grid">
                      <div>
                        <span>
                          Public ID
                        </span>

                        <strong>
                          {
                            selectedCustomer.id
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          E-mail verificado
                        </span>

                        <strong>
                          {selectedCustomer.emailVerified
                            ? "Sim"
                            : "Não"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Último acesso
                        </span>

                        <strong>
                          {formatDate(
                            selectedCustomer.lastLoginAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Data do cadastro
                        </span>

                        <strong>
                          {formatDate(
                            selectedCustomer.createdAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Última atualização
                        </span>

                        <strong>
                          {formatDate(
                            selectedCustomer.updatedAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Favoritos
                        </span>

                        <strong>
                          {
                            selectedCustomer
                              .statistics
                              .favoritesCount
                          }
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="customer-detail-section">
                    <div className="customer-section-title">
                      <MapPin
                        size={19}
                      />

                      <h3>
                        Endereços
                      </h3>

                      <span>
                        {
                          selectedCustomer
                            .addresses.length
                        }
                      </span>
                    </div>

                    {selectedCustomer
                      .addresses.length ===
                    0 ? (
                      <div className="customer-detail-empty">
                        Nenhum endereço
                        cadastrado.
                      </div>
                    ) : (
                      <div className="customer-address-list">
                        {selectedCustomer.addresses.map(
                          (address) => (
                            <article
                              key={
                                address.id
                              }
                            >
                              <header>
                                <div>
                                  <strong>
                                    {address.label ??
                                      "Endereço"}
                                  </strong>

                                  {address.isDefault && (
                                    <span>
                                      Principal
                                    </span>
                                  )}
                                </div>

                                <Home
                                  size={18}
                                />
                              </header>

                              <p>
                                {
                                  address.street
                                }
                                ,{" "}
                                {
                                  address.number
                                }

                                {address.complement
                                  ? `, ${address.complement}`
                                  : ""}
                              </p>

                              <span>
                                {
                                  address.neighborhood
                                }
                                {" · "}
                                {address.city}
                                {" - "}
                                {address.state}
                              </span>

                              <small>
                                CEP{" "}
                                {
                                  address.zipCode
                                }
                                {" · "}
                                {
                                  address.recipientName
                                }
                              </small>
                            </article>
                          ),
                        )}
                      </div>
                    )}
                  </section>

                  <section className="customer-detail-section">
                    <div className="customer-section-title">
                      <ShoppingBag
                        size={19}
                      />

                      <h3>
                        Pedidos recentes
                      </h3>

                      <span>
                        {
                          selectedCustomer
                            .recentOrders
                            .length
                        }
                      </span>
                    </div>

                    {selectedCustomer
                      .recentOrders.length ===
                    0 ? (
                      <div className="customer-detail-empty">
                        Nenhum pedido
                        encontrado.
                      </div>
                    ) : (
                      <div className="customer-orders-list">
                        {selectedCustomer.recentOrders.map(
                          (order) => (
                            <article
                              key={
                                order.number
                              }
                            >
                              <div className="customer-order-image">
                                {order.preview
                                  ?.imageUrl ? (
                                  <img
                                    src={
                                      order
                                        .preview
                                        .imageUrl
                                    }
                                    alt={
                                      order
                                        .preview
                                        .productName
                                    }
                                  />
                                ) : (
                                  <ShoppingBag
                                    size={20}
                                  />
                                )}
                              </div>

                              <div className="customer-order-info">
                                <strong>
                                  Pedido #
                                  {
                                    order.number
                                  }
                                </strong>

                                <span>
                                  {order.preview
                                    ?.productName ??
                                    "Pedido sem prévia"}
                                </span>

                                <small>
                                  {formatDate(
                                    order.createdAt,
                                  )}
                                </small>
                              </div>

                              <div className="customer-order-payment">
                                <span
                                  className={`customer-order-status customer-order-status-${getOrderStatusClass(
                                    order.status,
                                  )}`}
                                >
                                  {formatOrderStatus(
                                    order.status,
                                  )}
                                </span>

                                <strong>
                                  {formatMoney(
                                    order
                                      .totals
                                      .totalInCents,
                                  )}
                                </strong>

                                <small>
                                  {order.payment
                                    ? `${formatPaymentMethod(
                                        order
                                          .payment
                                          .method,
                                      )} · ${formatPaymentStatus(
                                        order
                                          .payment
                                          .status,
                                      )}`
                                    : "Sem pagamento"}
                                </small>
                              </div>
                            </article>
                          ),
                        )}
                      </div>
                    )}
                  </section>

                  <section className="customer-access-section">
                    <div>
                      <LockKeyhole
                        size={20}
                      />

                      <section>
                        <strong>
                          Controle de acesso
                        </strong>

                        <span>
                          Desativar ou
                          bloquear encerra as
                          sessões atuais do
                          cliente.
                        </span>
                      </section>
                    </div>

                    <div className="customer-status-actions">
                      <button
                        type="button"
                        className={
                          selectedCustomer.status ===
                          "ACTIVE"
                            ? "customer-status-action active selected"
                            : "customer-status-action active"
                        }
                        disabled={
                          changingStatus ||
                          selectedCustomer.status ===
                            "ACTIVE"
                        }
                        onClick={() => {
                          void updateStatus(
                            "ACTIVE",
                          );
                        }}
                      >
                        <CheckCircle2
                          size={16}
                        />

                        Ativar
                      </button>

                      <button
                        type="button"
                        className={
                          selectedCustomer.status ===
                          "INACTIVE"
                            ? "customer-status-action inactive selected"
                            : "customer-status-action inactive"
                        }
                        disabled={
                          changingStatus ||
                          selectedCustomer.status ===
                            "INACTIVE"
                        }
                        onClick={() => {
                          void updateStatus(
                            "INACTIVE",
                          );
                        }}
                      >
                        <Clock3
                          size={16}
                        />

                        Desativar
                      </button>

                      <button
                        type="button"
                        className={
                          selectedCustomer.status ===
                          "BLOCKED"
                            ? "customer-status-action blocked selected"
                            : "customer-status-action blocked"
                        }
                        disabled={
                          changingStatus ||
                          selectedCustomer.status ===
                            "BLOCKED"
                        }
                        onClick={() => {
                          void updateStatus(
                            "BLOCKED",
                          );
                        }}
                      >
                        {changingStatus ? (
                          <LoaderCircle
                            size={16}
                            className="icon-spinning"
                          />
                        ) : (
                          <Ban size={16} />
                        )}

                        Bloquear
                      </button>
                    </div>
                  </section>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}