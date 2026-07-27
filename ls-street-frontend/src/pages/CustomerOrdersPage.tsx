import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  ImageIcon,
  LoaderCircle,
  PackageCheck,
  ShoppingBag,
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
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  CustomerOrderListItem,
  CustomerOrdersResponse,
} from "../types/customer-orders";

import type {
  OrderStatus,
  Pagination,
  PaymentStatus,
} from "../types/orders";

const emptyPagination:
  Pagination = {
    page: 1,
    limit: 10,
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
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
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
    PENDING:
      "PIX pendente",

    IN_PROCESS:
      "Em análise",

    APPROVED:
      "Aprovado",

    REJECTED:
      "Rejeitado",

    CANCELLED:
      "Cancelado",

    REFUNDED:
      "Reembolsado",

    CHARGED_BACK:
      "Contestado",
  };

  return labels[status];
}

function getOrderStatusClass(
  status: OrderStatus,
) {
  if (
    status === "PAID" ||
    status === "PREPARING" ||
    status === "SHIPPED" ||
    status === "DELIVERED"
  ) {
    return "success";
  }

  if (
    status === "CANCELLED" ||
    status === "REFUNDED"
  ) {
    return "failed";
  }

  return "pending";
}

export function CustomerOrdersPage() {
  const [
    orders,
    setOrders,
  ] = useState<
    CustomerOrderListItem[]
  >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      emptyPagination,
    );

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadOrders =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await apiRequest<
            CustomerOrdersResponse
          >(
            `/orders?page=${page}&limit=10`,
          );

        setOrders(
          response.data,
        );

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
            ApiError
            ? caughtError.message
            : "Não foi possível carregar seus pedidos.",
        );
      } finally {
        setLoading(false);
      }
    }, [page]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadOrders();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadOrders]);

  return (
    <section className="customer-orders-page">
      <header className="customer-orders-header">
        <div>
          <span>
            MINHA CONTA
          </span>

          <h1>
            Meus pedidos
          </h1>

          <p>
            Consulte suas compras,
            pagamentos, entregas e
            códigos de rastreio.
          </p>
        </div>

        <Link to="/minha-conta">
          <ArrowLeft size={18} />

          Voltar para minha conta
        </Link>
      </header>

      {error && (
        <div className="customer-orders-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="customer-orders-state">
          <LoaderCircle
            size={30}
            className="icon-spinning"
          />

          <span>
            Carregando seus pedidos...
          </span>
        </div>
      ) : orders.length === 0 ? (
        <div className="customer-orders-state">
          <ShoppingBag
            size={46}
          />

          <h2>
            Você ainda não possui
            pedidos.
          </h2>

          <p>
            Seus pedidos aparecerão
            aqui depois da primeira
            compra.
          </p>

          <Link to="/">
            Explorar produtos
          </Link>
        </div>
      ) : (
        <>
          <div className="customer-orders-list">
            {orders.map(
              (order) => {
                const requiresPayment =
                  order.status ===
                    "PENDING_PAYMENT" ||
                  order.status ===
                    "PAYMENT_IN_REVIEW";

                return (
                  <article
                    key={order.number}
                    className="customer-order-card"
                  >
                    <div className="customer-order-preview">
                      {order.preview
                        ?.imageUrl ? (
                        <img
                          src={
                            order.preview
                              .imageUrl
                          }
                          alt={
                            order.preview
                              .productName
                          }
                        />
                      ) : (
                        <ImageIcon
                          size={31}
                        />
                      )}
                    </div>

                    <section className="customer-order-main">
                      <header>
                        <div>
                          <span>
                            PEDIDO
                          </span>

                          <h2>
                            #
                            {
                              order.number
                            }
                          </h2>
                        </div>

                        <span
                          className={`customer-order-status ${getOrderStatusClass(
                            order.status,
                          )}`}
                        >
                          {formatOrderStatus(
                            order.status,
                          )}
                        </span>
                      </header>

                      <div className="customer-order-information">
                        <div>
                          <span>
                            Data
                          </span>

                          <strong>
                            {formatDate(
                              order.createdAt,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Produtos
                          </span>

                          <strong>
                            {
                              order.itemsCount
                            }{" "}
                            {order.itemsCount ===
                            1
                              ? "unidade"
                              : "unidades"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Total
                          </span>

                          <strong>
                            {formatMoney(
                              order.totals
                                .totalInCents,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Pagamento
                          </span>

                          <strong>
                            {order.payment
                              ? formatPaymentStatus(
                                  order
                                    .payment
                                    .status,
                                )
                              : "Não iniciado"}
                          </strong>
                        </div>
                      </div>

                      {order.preview && (
                        <p className="customer-order-product-name">
                          {
                            order.preview
                              .productName
                          }

                          {order.itemsCount >
                            1 &&
                            ` e mais ${
                              order.itemsCount -
                              1
                            } ${
                              order.itemsCount -
                                1 ===
                              1
                                ? "item"
                                : "itens"
                            }`}
                        </p>
                      )}

                      <footer>
                        {requiresPayment ? (
                          <div className="customer-order-payment-warning">
                            <Clock3
                              size={17}
                            />

                            <span>
                              Pagamento pendente.
                              Abra o pedido para
                              visualizar ou gerar
                              o PIX.
                            </span>
                          </div>
                        ) : (
                          <div className="customer-order-progress">
                            <PackageCheck
                              size={17}
                            />

                            <span>
                              Acompanhe os detalhes
                              e a entrega do pedido.
                            </span>
                          </div>
                        )}

                        <Link
                          to={`/minha-conta/pedidos/${order.number}`}
                        >
                          <Eye size={17} />

                          Ver pedido
                        </Link>
                      </footer>
                    </section>
                  </article>
                );
              },
            )}
          </div>

          <footer className="customer-orders-pagination">
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