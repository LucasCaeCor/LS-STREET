import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Eye,
  ImageIcon,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
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
} from "../lib/api";

import type {
  OrderStatus,
  Pagination,
  PaymentMethod,
  PaymentStatus,
} from "../types/orders";

import type {
  AdminPayment,
  AdminPaymentResponse,
  AdminPaymentsResponse,
  PaymentSummary,
  PaymentSummaryResponse,
} from "../types/payments";

interface PaymentFilters {
  search: string;

  status:
    | PaymentStatus
    | "";

  method:
    | PaymentMethod
    | "";

  startDate: string;
  endDate: string;

  sortOrder:
    | "asc"
    | "desc";
}

const initialFilters:
  PaymentFilters = {
    search: "",

    status: "",
    method: "",

    startDate: "",
    endDate: "",

    sortOrder: "desc",
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

const emptySummary:
  PaymentSummary = {
    total: 0,

    pending: 0,
    inProcess: 0,
    approved: 0,

    rejected: 0,
    cancelled: 0,
    refunded: 0,
    chargedBack: 0,

    approvedAmountInCents: 0,
  };

const paymentStatuses:
  PaymentStatus[] = [
    "PENDING",
    "IN_PROCESS",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
    "REFUNDED",
    "CHARGED_BACK",
  ];

const paymentMethods:
  PaymentMethod[] = [
    "PIX",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BOLETO",
    "OTHER",
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

function getPaymentStatusClass(
  status: PaymentStatus,
) {
  return status
    .toLowerCase()
    .replace("_", "-");
}

function createDateTime(
  value: string,
) {
  return `${value}T00:00:00.000Z`;
}

export function PaymentsPage() {
  const [
    payments,
    setPayments,
  ] = useState<
    AdminPayment[]
  >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<PaymentSummary>(
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
    useState<PaymentFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<PaymentFilters>(
      initialFilters,
    );

  const [
    loadingPayments,
    setLoadingPayments,
  ] = useState(true);

  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedPayment,
    setSelectedPayment,
  ] =
    useState<
      AdminPayment | null
    >(null);

  const [
    loadingDetails,
    setLoadingDetails,
  ] = useState(false);

  const [
    detailsError,
    setDetailsError,
  ] = useState("");

  const loadSummary =
    useCallback(async () => {
      setLoadingSummary(true);

      try {
        const response =
          await apiRequest<
            PaymentSummaryResponse
          >(
            "/admin/payments/summary",
          );

        setSummary(
          response.data.summary,
        );
      } catch (caughtError) {
        setSummary(emptySummary);

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar o resumo.",
        );
      } finally {
        setLoadingSummary(false);
      }
    }, []);

  const loadPayments =
    useCallback(async () => {
      setLoadingPayments(true);
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

      if (filters.status) {
        query.set(
          "status",
          filters.status,
        );
      }

      if (filters.method) {
        query.set(
          "method",
          filters.method,
        );
      }

      if (filters.startDate) {
        query.set(
          "startDate",
          createDateTime(
            filters.startDate,
          ),
        );
      }

      if (filters.endDate) {
        query.set(
          "endDate",
          createDateTime(
            filters.endDate,
          ),
        );
      }

      try {
        const response =
          await apiRequest<
            AdminPaymentsResponse
          >(
            `/admin/payments/?${query.toString()}`,
          );

        setPayments(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setPayments([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar os pagamentos.",
        );
      } finally {
        setLoadingPayments(false);
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
        void loadPayments();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadPayments]);

  const problematicPayments =
    useMemo(
      () =>
        summary.rejected +
        summary.cancelled +
        summary.refunded +
        summary.chargedBack,
      [summary],
    );

  function applyFilters(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      draftFilters.startDate &&
      draftFilters.endDate &&
      draftFilters.startDate >
        draftFilters.endDate
    ) {
      setError(
        "A data inicial não pode ser posterior à data final.",
      );

      return;
    }

    setError("");
    setPage(1);

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
      loadPayments(),
    ]);
  }

  async function openDetails(
    payment: AdminPayment,
  ) {
    setSelectedPayment(
      payment,
    );

    setLoadingDetails(true);
    setDetailsError("");

    try {
      const response =
        await apiRequest<
          AdminPaymentResponse
        >(
          `/admin/payments/${payment.id}`,
        );

      setSelectedPayment(
        response.data.payment,
      );
    } catch (caughtError) {
      setDetailsError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível carregar os detalhes.",
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetails() {
    setSelectedPayment(null);
    setDetailsError("");
  }

  return (
    <div className="payments-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            FINANCEIRO
          </span>

          <h1>Pagamentos</h1>

          <p>
            Acompanhe cobranças,
            aprovações e transações.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            void reloadAll();
          }}
          disabled={
            loadingPayments ||
            loadingSummary
          }
        >
          <RefreshCw
            size={17}
            className={
              loadingPayments ||
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

      <section className="payment-summary-grid">
        <article className="payment-summary-card payment-summary-revenue">
          <CircleDollarSign
            size={22}
          />

          <div>
            <span>
              Valor aprovado
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : formatMoney(
                    summary
                      .approvedAmountInCents,
                  )}
            </strong>
          </div>
        </article>

        <article className="payment-summary-card">
          <ReceiptText
            size={22}
          />

          <div>
            <span>
              Total de cobranças
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.total}
            </strong>
          </div>
        </article>

        <article className="payment-summary-card">
          <CheckCircle2
            size={22}
          />

          <div>
            <span>Aprovados</span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.approved}
            </strong>
          </div>
        </article>

        <article className="payment-summary-card">
          <Clock3 size={22} />

          <div>
            <span>
              Pendentes/análise
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.pending +
                  summary.inProcess}
            </strong>
          </div>
        </article>

        <article
          className={
            problematicPayments > 0
              ? "payment-summary-card payment-summary-warning"
              : "payment-summary-card"
          }
        >
          <AlertTriangle
            size={22}
          />

          <div>
            <span>
              Com problemas
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : problematicPayments}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="payments-filter-panel"
        onSubmit={applyFilters}
      >
        <div className="payment-search-field">
          <label htmlFor="payment-search">
            Buscar
          </label>

          <div className="payment-search-input">
            <Search size={17} />

            <input
              id="payment-search"
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
              placeholder="Pedido, cliente, e-mail ou ID"
            />
          </div>
        </div>

        <label>
          <span>Status</span>

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
                      | PaymentStatus
                      | "",
                }),
              )
            }
          >
            <option value="">
              Todos
            </option>

            {paymentStatuses.map(
              (status) => (
                <option
                  value={status}
                  key={status}
                >
                  {formatPaymentStatus(
                    status,
                  )}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Método</span>

          <select
            value={
              draftFilters.method
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  method:
                    event.target
                      .value as
                      | PaymentMethod
                      | "",
                }),
              )
            }
          >
            <option value="">
              Todos
            </option>

            {paymentMethods.map(
              (method) => (
                <option
                  value={method}
                  key={method}
                >
                  {formatPaymentMethod(
                    method,
                  )}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Data inicial</span>

          <input
            type="date"
            value={
              draftFilters.startDate
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  startDate:
                    event.target
                      .value,
                }),
              )
            }
          />
        </label>

        <label>
          <span>Data final</span>

          <input
            type="date"
            value={
              draftFilters.endDate
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  endDate:
                    event.target
                      .value,
                }),
              )
            }
          />
        </label>

        <label>
          <span>Ordenação</span>

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
        </label>

        <div className="payments-filter-actions">
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

      <section className="payments-list-panel">
        {loadingPayments ? (
          <div className="payments-state">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            Carregando pagamentos...
          </div>
        ) : payments.length === 0 ? (
          <div className="payments-state">
            <WalletCards
              size={35}
            />

            <strong>
              Nenhum pagamento
              encontrado.
            </strong>

            <span>
              Altere os filtros ou
              aguarde novas cobranças.
            </span>
          </div>
        ) : (
          <div className="payments-table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Pedido/cliente</th>
                  <th>Cobrança</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Referência</th>
                  <th>Data</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {payments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                    >
                      <td>
                        <div className="payment-order-cell">
                          <strong>
                            Pedido #
                            {
                              payment
                                .order
                                .number
                            }
                          </strong>

                          <span>
                            {
                              payment
                                .order
                                .customerName
                            }
                          </span>

                          <small>
                            {
                              payment
                                .order
                                .customerEmail
                            }
                          </small>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {formatPaymentMethod(
                            payment.method,
                          )}
                        </strong>

                        <span>
                          Mercado Pago
                        </span>

                        {payment.installments && (
                          <small>
                            {
                              payment.installments
                            }
                            x
                          </small>
                        )}
                      </td>

                      <td>
                        <strong className="payment-amount">
                          {formatMoney(
                            payment
                              .amountInCents,
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`payment-status payment-status-${getPaymentStatusClass(
                            payment.status,
                          )}`}
                        >
                          {formatPaymentStatus(
                            payment.status,
                          )}
                        </span>

                        {payment.rawStatus && (
                          <small>
                            {
                              payment.rawStatus
                            }
                          </small>
                        )}
                      </td>

                      <td>
                        <strong>
                          {payment.externalReference ??
                            "Sem referência"}
                        </strong>

                        <span>
                          {payment.gatewayPaymentId
                            ? `MP: ${payment.gatewayPaymentId}`
                            : "Sem ID do gateway"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatDate(
                            payment.createdAt,
                          )}
                        </strong>

                        {payment.approvedAt && (
                          <span>
                            Aprovado em{" "}
                            {formatDate(
                              payment.approvedAt,
                            )}
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="payment-details-button"
                          onClick={() => {
                            void openDetails(
                              payment,
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

        {!loadingPayments &&
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

      {selectedPayment && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeDetails
          }
        >
          <section
            className="payment-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="payment-details-header">
              <div>
                <span className="eyebrow">
                  PAGAMENTO
                </span>

                <h2>
                  Pedido #
                  {
                    selectedPayment
                      .order.number
                  }
                </h2>

                <p>
                  {
                    selectedPayment
                      .externalReference ??
                    selectedPayment.id
                  }
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={
                  closeDetails
                }
              >
                <X size={21} />
              </button>
            </header>

            <div className="payment-details-content">
              {detailsError && (
                <div className="form-error">
                  {detailsError}
                </div>
              )}

              {loadingDetails ? (
                <div className="payments-state">
                  <LoaderCircle
                    size={28}
                    className="icon-spinning"
                  />

                  Carregando detalhes...
                </div>
              ) : (
                <>
                  <section className="payment-detail-hero">
                    <div>
                      <span>
                        Valor da cobrança
                      </span>

                      <strong>
                        {formatMoney(
                          selectedPayment
                            .amountInCents,
                        )}
                      </strong>

                      <small>
                        {formatPaymentMethod(
                          selectedPayment
                            .method,
                        )}

                        {" · "}

                        Mercado Pago
                      </small>
                    </div>

                    <span
                      className={`payment-status payment-status-${getPaymentStatusClass(
                        selectedPayment
                          .status,
                      )}`}
                    >
                      {formatPaymentStatus(
                        selectedPayment
                          .status,
                      )}
                    </span>
                  </section>

                  {selectedPayment.ticketUrl &&
                    selectedPayment.status ===
                      "PENDING" && (
                      <a
                        className="payment-ticket-link"
                        href={
                          selectedPayment
                            .ticketUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink
                          size={17}
                        />

                        Abrir cobrança PIX
                      </a>
                    )}

                  <section className="payment-detail-section">
                    <div className="payment-section-title">
                      <Banknote
                        size={19}
                      />

                      <h3>
                        Dados da transação
                      </h3>
                    </div>

                    <div className="payment-data-grid">
                      <div>
                        <span>
                          ID interno
                        </span>

                        <strong>
                          {
                            selectedPayment.id
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          ID Mercado Pago
                        </span>

                        <strong>
                          {selectedPayment.gatewayPaymentId ??
                            "Não informado"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Ordem no gateway
                        </span>

                        <strong>
                          {selectedPayment.gatewayOrderId ??
                            "Não informado"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Preferência
                        </span>

                        <strong>
                          {selectedPayment.gatewayPreferenceId ??
                            "Não informada"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Status original
                        </span>

                        <strong>
                          {selectedPayment.rawStatus ??
                            "Não informado"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Parcelas
                        </span>

                        <strong>
                          {selectedPayment.installments ??
                            1}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="payment-detail-section">
                    <div className="payment-section-title">
                      <UserRound
                        size={19}
                      />

                      <h3>Cliente</h3>
                    </div>

                    <div className="payment-customer-card">
                      <strong>
                        {
                          selectedPayment
                            .order
                            .customerName
                        }
                      </strong>

                      <span>
                        {
                          selectedPayment
                            .order
                            .customerEmail
                        }
                      </span>

                      <small>
                        {selectedPayment
                          .order
                          .customerPhone ??
                          "Telefone não informado"}
                      </small>
                    </div>
                  </section>

                  <section className="payment-detail-section">
                    <div className="payment-section-title">
                      <ReceiptText
                        size={19}
                      />

                      <h3>
                        Pedido e valores
                      </h3>
                    </div>

                    <div className="payment-order-status-row">
                      <span>
                        Status do pedido
                      </span>

                      <strong>
                        {formatOrderStatus(
                          selectedPayment
                            .order
                            .status,
                        )}
                      </strong>
                    </div>

                    <div className="payment-totals-list">
                      <div>
                        <span>
                          Subtotal
                        </span>

                        <strong>
                          {formatMoney(
                            selectedPayment
                              .order
                              .subtotalInCents,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Desconto
                        </span>

                        <strong>
                          -
                          {formatMoney(
                            selectedPayment
                              .order
                              .discountInCents,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Frete</span>

                        <strong>
                          {formatMoney(
                            selectedPayment
                              .order
                              .shippingInCents,
                          )}
                        </strong>
                      </div>

                      <div className="payment-total-row">
                        <span>Total</span>

                        <strong>
                          {formatMoney(
                            selectedPayment
                              .order
                              .totalInCents,
                          )}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="payment-detail-section">
                    <div className="payment-section-title">
                      <WalletCards
                        size={19}
                      />

                      <h3>Produtos</h3>
                    </div>

                    <div className="payment-items-list">
                      {selectedPayment.order.items.map(
                        (
                          item,
                          index,
                        ) => (
                          <article
                            key={`${item.sku}-${index}`}
                          >
                            <div className="payment-item-image">
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
                                <ImageIcon
                                  size={20}
                                />
                              )}
                            </div>

                            <div className="payment-item-info">
                              <strong>
                                {
                                  item.productName
                                }
                              </strong>

                              <span>
                                {item.variantName ??
                                  "Variação padrão"}

                                {" · "}

                                {item.sku}
                              </span>

                              <small>
                                {
                                  item.quantity
                                }{" "}
                                ×{" "}
                                {formatMoney(
                                  item.unitPriceInCents,
                                )}
                              </small>
                            </div>

                            <strong>
                              {formatMoney(
                                item.totalInCents,
                              )}
                            </strong>
                          </article>
                        ),
                      )}
                    </div>
                  </section>

                  <section className="payment-detail-section">
                    <div className="payment-section-title">
                      <Clock3
                        size={19}
                      />

                      <h3>Datas</h3>
                    </div>

                    <div className="payment-date-list">
                      <div>
                        <span>
                          Cobrança criada
                        </span>

                        <strong>
                          {formatDate(
                            selectedPayment
                              .createdAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Última atualização
                        </span>

                        <strong>
                          {formatDate(
                            selectedPayment
                              .updatedAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Vencimento
                        </span>

                        <strong>
                          {formatDate(
                            selectedPayment
                              .expiresAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Aprovação
                        </span>

                        <strong>
                          {formatDate(
                            selectedPayment
                              .approvedAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Cancelamento
                        </span>

                        <strong>
                          {formatDate(
                            selectedPayment
                              .cancelledAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Reembolso
                        </span>

                        <strong>
                          {formatDate(
                            selectedPayment
                              .refundedAt,
                          )}
                        </strong>
                      </div>
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