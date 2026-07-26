import {
  Box,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  LoaderCircle,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  apiRequest,
  ApiError,
} from "../lib/api";

import type {
  AdminOrderDetails,
  AdminOrderDetailsResponse,
  AdminOrderListItem,
  AdminOrdersResponse,
  OrderStatus,
  Pagination,
  PaymentMethod,
  PaymentStatus,
  UpdateOrderStatusResponse,
} from "../types/orders";

const orderStatuses: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_IN_REVIEW",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING_PAYMENT: [
    "PAYMENT_IN_REVIEW",
    "PAID",
    "CANCELLED",
  ],

  PAYMENT_IN_REVIEW: [
    "PAID",
    "PENDING_PAYMENT",
    "CANCELLED",
  ],

  PAID: [
    "PREPARING",
    "CANCELLED",
    "REFUNDED",
  ],

  PREPARING: [
    "SHIPPED",
    "CANCELLED",
    "REFUNDED",
  ],

  SHIPPED: [
    "DELIVERED",
    "REFUNDED",
  ],

  DELIVERED: ["REFUNDED"],

  CANCELLED: [],
  REFUNDED: [],
};

interface OrderFilters {
  number: string;
  customer: string;
  status: OrderStatus | "";
  from: string;
  to: string;
  sortOrder: "asc" | "desc";
}

const initialFilters: OrderFilters = {
  number: "",
  customer: "",
  status: "",
  from: "",
  to: "",
  sortOrder: "desc",
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatMoney(valueInCents: number) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(valueInCents / 100);
}

function formatDate(
  value: string | null,
  includeTime = true,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    includeTime
      ? {
          dateStyle: "short",
          timeStyle: "short",
        }
      : {
          dateStyle: "short",
        },
  ).format(new Date(value));
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

function formatPaymentStatus(
  status: PaymentStatus,
) {
  const labels: Record<
    PaymentStatus,
    string
  > = {
    PENDING: "Pendente",
    IN_PROCESS: "Em processamento",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
    CHARGED_BACK: "Contestado",
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
    CREDIT_CARD: "Cartão de crédito",
    DEBIT_CARD: "Cartão de débito",
    BOLETO: "Boleto",
    OTHER: "Outro",
  };

  return labels[method];
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatZipCode(value: string) {
  const numbers = onlyNumbers(value);

  if (numbers.length !== 8) {
    return value;
  }

  return `${numbers.slice(
    0,
    5,
  )}-${numbers.slice(5)}`;
}

export function OrdersPage() {
  const [orders, setOrders] =
    useState<AdminOrderListItem[]>(
      [],
    );

  const [
    pagination,
    setPagination,
  ] = useState<Pagination>(
    emptyPagination,
  );

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<OrderFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<OrderFilters>(
      initialFilters,
    );

 

  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<AdminOrderDetails | null>(
      null,
    );

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    detailsError,
    setDetailsError,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    nextStatus,
    setNextStatus,
  ] = useState<OrderStatus | "">(
    "",
  );

  const [
    trackingCode,
    setTrackingCode,
  ] = useState("");

  const [
    trackingUrl,
    setTrackingUrl,
  ] = useState("");

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [
    statusError,
    setStatusError,
  ] = useState("");

  const loadOrders =
    useCallback(async () => {
      setLoading(true);
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

      if (filters.number) {
        query.set(
          "number",
          filters.number,
        );
      }

      if (filters.customer) {
        query.set(
          "customer",
          filters.customer,
        );
      }

      if (filters.status) {
        query.set(
          "status",
          filters.status,
        );
      }

      if (filters.from) {
        query.set(
          "from",
          filters.from,
        );
      }

      if (filters.to) {
        query.set(
          "to",
          filters.to,
        );
      }

      try {
        const response =
          await apiRequest<
            AdminOrdersResponse
          >(
            `/admin/orders?${query.toString()}`,
          );

        setOrders(response.data);

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setOrders([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar os pedidos.",
        );
      } finally {
        setLoading(false);
      }
    }, [
  filters,
  page,
]);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void loadOrders();
}, [loadOrders]);

  const pageRevenue =
    useMemo(
      () =>
        orders.reduce(
          (total, order) =>
            total +
            order.totals
              .totalInCents,
          0,
        ),
      [orders],
    );

  const pendingOnPage =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.status ===
              "PENDING_PAYMENT" ||
            order.status ===
              "PAYMENT_IN_REVIEW",
        ).length,
      [orders],
    );

  async function openOrder(
    number: number,
  ) {
    setModalOpen(true);
    setDetailsLoading(true);
    setDetailsError("");
    setStatusError("");
    setSelectedOrder(null);
    setNextStatus("");
    setTrackingCode("");
    setTrackingUrl("");

    try {
      const response =
        await apiRequest<
          AdminOrderDetailsResponse
        >(
          `/admin/orders/${number}`,
        );

      const order =
        response.data.order;

      setSelectedOrder(order);

      setTrackingCode(
        order.shipping
          .trackingCode ?? "",
      );

      setTrackingUrl(
        order.shipping
          .trackingUrl ?? "",
      );

      setNextStatus(
        allowedTransitions[
          order.status
        ][0] ?? "",
      );
    } catch (caughtError) {
      setDetailsError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível carregar o pedido.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeModal() {
    if (updatingStatus) {
      return;
    }

    setModalOpen(false);
    setSelectedOrder(null);
    setDetailsError("");
    setStatusError("");
  }

  function handleFilterSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setPage(1);

    setFilters({
      ...draftFilters,

      number:
        draftFilters.number.trim(),

      customer:
        draftFilters.customer.trim(),
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
  }

  async function handleStatusUpdate(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !selectedOrder ||
      !nextStatus
    ) {
      return;
    }

    if (
      nextStatus === "SHIPPED" &&
      !trackingCode.trim()
    ) {
      setStatusError(
        "Informe o código de rastreio.",
      );

      return;
    }

    setUpdatingStatus(true);
    setStatusError("");

    const body: {
      status: OrderStatus;
      trackingCode?: string;
      trackingUrl?: string;
    } = {
      status: nextStatus,
    };

    if (trackingCode.trim()) {
      body.trackingCode =
        trackingCode.trim();
    }

    if (trackingUrl.trim()) {
      body.trackingUrl =
        trackingUrl.trim();
    }

    try {
      await apiRequest<
        UpdateOrderStatusResponse
      >(
        `/admin/orders/${selectedOrder.number}/status`,
        {
          method: "PATCH",

          body: JSON.stringify(
            body,
          ),
        },
      );

      await loadOrders();

await openOrder(
  selectedOrder.number,
);
    } catch (caughtError) {
      if (
        caughtError instanceof
        ApiError
      ) {
        setStatusError(
          caughtError.message,
        );
      } else {
        setStatusError(
          "Não foi possível atualizar o status.",
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="orders-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            GESTÃO DE VENDAS
          </span>

          <h1>Pedidos</h1>

          <p>
            Acompanhe pagamentos,
            preparação, envio e
            entrega dos pedidos.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
  void loadOrders();
}}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? "icon-spinning"
                : ""
            }
          />

          Atualizar
        </button>
      </header>

      <section className="order-summary-grid">
        <article className="order-summary-card">
          <ShoppingBag size={21} />

          <div>
            <span>
              Total encontrado
            </span>

            <strong>
              {
                pagination.totalItems
              }
            </strong>
          </div>
        </article>

        <article className="order-summary-card">
          <CircleDollarSign
            size={21}
          />

          <div>
            <span>
              Valor nesta página
            </span>

            <strong>
              {formatMoney(
                pageRevenue,
              )}
            </strong>
          </div>
        </article>

        <article className="order-summary-card">
          <PackageCheck
            size={21}
          />

          <div>
            <span>
              Aguardando pagamento
            </span>

            <strong>
              {pendingOnPage}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="orders-filter-panel"
        onSubmit={
          handleFilterSubmit
        }
      >
        <div className="filter-field filter-customer">
          <label htmlFor="customer">
            Cliente
          </label>

          <div className="filter-input">
            <Search size={17} />

            <input
              id="customer"
              value={
                draftFilters.customer
              }
              onChange={(event) =>
                setDraftFilters(
                  (current) => ({
                    ...current,

                    customer:
                      event.target
                        .value,
                  }),
                )
              }
              placeholder="Nome, e-mail ou telefone"
            />
          </div>
        </div>

        <div className="filter-field">
          <label htmlFor="order-number">
            Pedido
          </label>

          <input
            id="order-number"
            className="standalone-input"
            inputMode="numeric"
            value={
              draftFilters.number
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  number:
                    onlyNumbers(
                      event.target
                        .value,
                    ),
                }),
              )
            }
            placeholder="#123"
          />
        </div>

        <div className="filter-field">
          <label htmlFor="status">
            Status
          </label>

          <select
            id="status"
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
                      | OrderStatus
                      | "",
                }),
              )
            }
          >
            <option value="">
              Todos
            </option>

            {orderStatuses.map(
              (status) => (
                <option
                  value={status}
                  key={status}
                >
                  {formatOrderStatus(
                    status,
                  )}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="from">
            De
          </label>

          <input
            id="from"
            className="standalone-input"
            type="date"
            value={
              draftFilters.from
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  from:
                    event.target
                      .value,
                }),
              )
            }
          />
        </div>

        <div className="filter-field">
          <label htmlFor="to">
            Até
          </label>

          <input
            id="to"
            className="standalone-input"
            type="date"
            value={draftFilters.to}
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  to:
                    event.target
                      .value,
                }),
              )
            }
          />
        </div>

        <div className="filter-field">
          <label htmlFor="sort">
            Ordem
          </label>

          <select
            id="sort"
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
        </div>

        <div className="filter-actions">
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

      <section className="orders-list-panel">
        {loading ? (
          <div className="orders-state">
            <LoaderCircle
              size={27}
              className="icon-spinning"
            />

            <span>
              Carregando pedidos...
            </span>
          </div>
        ) : error ? (
          <div className="orders-state error-state">
            <strong>
              Não foi possível
              carregar os pedidos.
            </strong>

            <span>{error}</span>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
  void loadOrders();
}}
            >
              Tentar novamente
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-state">
            <ShoppingBag
              size={32}
            />

            <strong>
              Nenhum pedido
              encontrado.
            </strong>

            <span>
              Altere os filtros para
              realizar uma nova busca.
            </span>
          </div>
        ) : (
          <div className="orders-table-wrapper admin-orders-table-wrapper">
            <table className="orders-table admin-orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Produto</th>
                  <th>Cliente</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Data</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {orders.map(
                  (order) => (
                    <tr
                      key={
                        order.number
                      }
                    >
                      <td>
                        <strong className="order-number">
                          #
                          {
                            order.number
                          }
                        </strong>

                        <small>
                          {
                            order.itemsCount
                          }{" "}
                          {order.itemsCount ===
                          1
                            ? "item"
                            : "itens"}
                        </small>
                      </td>

                      <td>
                        <div className="order-product-cell">
                          <div className="order-product-image">
                            {order
                              .preview
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
                              <Box
                                size={19}
                              />
                            )}
                          </div>

                          <span>
                            {order
                              .preview
                              ?.productName ??
                              "Produto indisponível"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="customer-table-cell">
                          <strong>
                            {
                              order
                                .customer
                                .name
                            }
                          </strong>

                          <span>
                            {
                              order
                                .customer
                                .email
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {order.payment ? (
                          <div className="payment-table-cell">
                            <strong>
                              {formatPaymentMethod(
                                order
                                  .payment
                                  .method,
                              )}
                            </strong>

                            <span
                              className={`payment-status payment-${order.payment.status.toLowerCase()}`}
                            >
                              {formatPaymentStatus(
                                order
                                  .payment
                                  .status,
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="muted-text">
                            Sem pagamento
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`order-status order-status-${order.status.toLowerCase()}`}
                        >
                          {formatOrderStatus(
                            order.status,
                          )}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            order.totals
                              .totalInCents,
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          order.dates
                            .createdAt,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() =>
                            void openOrder(
                              order.number,
                            )
                          }
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading &&
          !error &&
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
                    !pagination.hasPreviousPage
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
                    !pagination.hasNextPage
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

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >
          <section
            className="order-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="order-modal-header">
              <div>
                <span className="eyebrow">
                  DETALHES DO PEDIDO
                </span>

                <h2>
                  {selectedOrder
                    ? `Pedido #${selectedOrder.number}`
                    : "Carregando pedido"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeModal}
                disabled={
                  updatingStatus
                }
              >
                <X size={21} />
              </button>
            </header>

            {detailsLoading ? (
              <div className="modal-loading">
                <LoaderCircle
                  size={30}
                  className="icon-spinning"
                />

                Carregando detalhes...
              </div>
            ) : detailsError ? (
              <div className="modal-error">
                <strong>
                  Não foi possível
                  carregar o pedido.
                </strong>

                <span>
                  {detailsError}
                </span>
              </div>
            ) : selectedOrder ? (
              <div className="order-modal-content">
                <div className="order-modal-top">
                  <span
                    className={`order-status order-status-${selectedOrder.status.toLowerCase()}`}
                  >
                    {formatOrderStatus(
                      selectedOrder.status,
                    )}
                  </span>

                  <span>
                    Criado em{" "}
                    {formatDate(
                      selectedOrder
                        .dates
                        .createdAt,
                    )}
                  </span>
                </div>

                <section className="order-detail-grid">
                  <article className="order-detail-card">
                    <div className="detail-card-title">
                      <UserRound
                        size={18}
                      />
                      Cliente
                    </div>

                    <strong>
                      {
                        selectedOrder
                          .customer.name
                      }
                    </strong>

                    <span>
                      <Mail size={15} />

                      {
                        selectedOrder
                          .customer.email
                      }
                    </span>

                    {selectedOrder
                      .customer.phone && (
                      <span>
                        <Phone
                          size={15}
                        />

                        {
                          selectedOrder
                            .customer
                            .phone
                        }
                      </span>
                    )}
                  </article>

                  <article className="order-detail-card">
                    <div className="detail-card-title">
                      <MapPin
                        size={18}
                      />
                      Endereço de entrega
                    </div>

                    <strong>
                      {
                        selectedOrder
                          .shippingAddress
                          .recipient
                      }
                    </strong>

                    <span>
                      {
                        selectedOrder
                          .shippingAddress
                          .street
                      }
                      ,{" "}
                      {
                        selectedOrder
                          .shippingAddress
                          .number
                      }
                    </span>

                    {selectedOrder
                      .shippingAddress
                      .complement && (
                      <span>
                        {
                          selectedOrder
                            .shippingAddress
                            .complement
                        }
                      </span>
                    )}

                    <span>
                      {
                        selectedOrder
                          .shippingAddress
                          .district
                      }
                      {" · "}
                      {
                        selectedOrder
                          .shippingAddress
                          .city
                      }
                      /
                      {
                        selectedOrder
                          .shippingAddress
                          .state
                      }
                    </span>

                    <span>
                      CEP{" "}
                      {formatZipCode(
                        selectedOrder
                          .shippingAddress
                          .zipCode,
                      )}
                    </span>
                  </article>
                </section>

                <section className="order-items-section">
                  <div className="section-title">
                    <ShoppingBag
                      size={18}
                    />

                    <h3>
                      Produtos
                    </h3>
                  </div>

                  <div className="order-detail-items">
                    {selectedOrder.items.map(
                      (
                        item,
                        index,
                      ) => (
                        <article
                          className="order-detail-item"
                          key={`${item.sku}-${index}`}
                        >
                          <div className="order-detail-item-image">
                            {item.imageUrl ? (
                              <img
                                src={
                                  item.imageUrl
                                }
                                alt={
                                  item.productName
                                }
                              />
                            ) : (
                              <Box
                                size={21}
                              />
                            )}
                          </div>

                          <div className="order-detail-item-info">
                            <strong>
                              {
                                item.productName
                              }
                            </strong>

                            <span>
                              {item.variantName ??
                                "Variação padrão"}
                            </span>

                            <small>
                              SKU:{" "}
                              {item.sku}
                            </small>
                          </div>

                          <div className="order-detail-item-quantity">
                            {
                              item.quantity
                            }
                            x
                          </div>

                          <div className="order-detail-item-price">
                            <span>
                              {formatMoney(
                                item.unitPriceInCents,
                              )}
                            </span>

                            <strong>
                              {formatMoney(
                                item.totalInCents,
                              )}
                            </strong>
                          </div>
                        </article>
                      ),
                    )}
                  </div>
                </section>

                <section className="order-detail-grid">
                  <article className="order-detail-card">
                    <div className="detail-card-title">
                      <CircleDollarSign
                        size={18}
                      />
                      Valores
                    </div>

                    <div className="totals-list">
                      <div>
                        <span>
                          Subtotal
                        </span>

                        <strong>
                          {formatMoney(
                            selectedOrder
                              .totals
                              .subtotalInCents,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Desconto
                        </span>

                        <strong className="discount-value">
                          -
                          {formatMoney(
                            selectedOrder
                              .totals
                              .discountInCents,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Frete
                        </span>

                        <strong>
                          {formatMoney(
                            selectedOrder
                              .totals
                              .shippingInCents,
                          )}
                        </strong>
                      </div>

                      {selectedOrder
                        .coupon && (
                        <div>
                          <span>
                            Cupom
                          </span>

                          <strong>
                            {
                              selectedOrder
                                .coupon
                                .code
                            }
                          </strong>
                        </div>
                      )}

                      <div className="total-row">
                        <span>Total</span>

                        <strong>
                          {formatMoney(
                            selectedOrder
                              .totals
                              .totalInCents,
                          )}
                        </strong>
                      </div>
                    </div>
                  </article>

                  <article className="order-detail-card">
                    <div className="detail-card-title">
                      <Truck size={18} />
                      Envio
                    </div>

                    <div className="shipping-information">
                      <span>
                        Código:
                      </span>

                      <strong>
                        {selectedOrder
                          .shipping
                          .trackingCode ??
                          "Ainda não informado"}
                      </strong>

                      <span>
                        Enviado em:
                      </span>

                      <strong>
                        {formatDate(
                          selectedOrder
                            .shipping
                            .shippedAt,
                        )}
                      </strong>

                      {selectedOrder
                        .shipping
                        .trackingUrl && (
                        <a
                          href={
                            selectedOrder
                              .shipping
                              .trackingUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir rastreamento

                          <ExternalLink
                            size={14}
                          />
                        </a>
                      )}
                    </div>
                  </article>
                </section>

                <section className="order-payments-section">
                  <div className="section-title">
                    <CircleDollarSign
                      size={18}
                    />

                    <h3>
                      Pagamentos
                    </h3>
                  </div>

                  {selectedOrder
                    .payments.length ===
                  0 ? (
                    <div className="empty-payment">
                      Nenhum pagamento
                      registrado.
                    </div>
                  ) : (
                    <div className="payments-list">
                      {selectedOrder.payments.map(
                        (
                          payment,
                          index,
                        ) => (
                          <article
                            className="payment-history-item"
                            key={`${payment.createdAt}-${index}`}
                          >
                            <div>
                              <strong>
                                {formatPaymentMethod(
                                  payment.method,
                                )}
                              </strong>

                              <span>
                                {
                                  payment.gateway
                                }
                              </span>
                            </div>

                            <span
                              className={`payment-status payment-${payment.status.toLowerCase()}`}
                            >
                              {formatPaymentStatus(
                                payment.status,
                              )}
                            </span>

                            <strong>
                              {formatMoney(
                                payment.amountInCents,
                              )}
                            </strong>

                            <span>
                              {formatDate(
                                payment.createdAt,
                              )}
                            </span>
                          </article>
                        ),
                      )}
                    </div>
                  )}
                </section>

                <section className="order-dates-section">
                  <div className="section-title">
                    <CalendarDays
                      size={18}
                    />

                    <h3>
                      Histórico
                    </h3>
                  </div>

                  <div className="order-dates-grid">
                    <div>
                      <span>
                        Criado
                      </span>

                      <strong>
                        {formatDate(
                          selectedOrder
                            .dates
                            .createdAt,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Pago
                      </span>

                      <strong>
                        {formatDate(
                          selectedOrder
                            .dates
                            .paidAt,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Enviado
                      </span>

                      <strong>
                        {formatDate(
                          selectedOrder
                            .dates
                            .shippedAt,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Entregue
                      </span>

                      <strong>
                        {formatDate(
                          selectedOrder
                            .dates
                            .deliveredAt,
                        )}
                      </strong>
                    </div>
                  </div>
                </section>

                <form
                  className="status-update-panel"
                  onSubmit={
                    handleStatusUpdate
                  }
                >
                  <div>
                    <span className="eyebrow">
                      ATUALIZAÇÃO
                    </span>

                    <h3>
                      Alterar status
                    </h3>
                  </div>

                  {allowedTransitions[
                    selectedOrder.status
                  ].length === 0 ? (
                    <div className="final-status-message">
                      Este pedido está em
                      um status final e não
                      pode mais ser
                      alterado.
                    </div>
                  ) : (
                    <>
                      {statusError && (
                        <div className="form-error status-form-error">
                          {statusError}
                        </div>
                      )}

                      <div className="status-form-grid">
                        <label>
                          <span>
                            Próximo status
                          </span>

                          <select
                            value={
                              nextStatus
                            }
                            onChange={(
                              event,
                            ) =>
                              setNextStatus(
                                event
                                  .target
                                  .value as
                                  OrderStatus,
                              )
                            }
                          >
                            {allowedTransitions[
                              selectedOrder
                                .status
                            ].map(
                              (
                                status,
                              ) => (
                                <option
                                  value={
                                    status
                                  }
                                  key={
                                    status
                                  }
                                >
                                  {formatOrderStatus(
                                    status,
                                  )}
                                </option>
                              ),
                            )}
                          </select>
                        </label>

                        {nextStatus ===
                          "SHIPPED" && (
                          <>
                            <label>
                              <span>
                                Código de
                                rastreio
                              </span>

                              <input
                                value={
                                  trackingCode
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setTrackingCode(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="BR123456789"
                                required
                              />
                            </label>

                            <label className="tracking-url-field">
                              <span>
                                URL de
                                rastreio
                              </span>

                              <input
                                type="url"
                                value={
                                  trackingUrl
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setTrackingUrl(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                placeholder="https://..."
                              />
                            </label>
                          </>
                        )}

                        <button
                          type="submit"
                          className="compact-primary-button status-submit-button"
                          disabled={
                            updatingStatus ||
                            !nextStatus
                          }
                        >
                          {updatingStatus ? (
                            <>
                              <LoaderCircle
                                size={17}
                                className="icon-spinning"
                              />
                              Atualizando...
                            </>
                          ) : (
                            "Atualizar status"
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}