import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router";

import {
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  CheckoutPayment,
  CreatePaymentResponse,
  LatestPaymentResponse,
} from "../types/checkout";

import type {
  CustomerOrderDetails,
  CustomerOrderDetailsResponse,
} from "../types/customer-orders";

import type {
  OrderStatus,
} from "../types/orders";

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
  value: string | null,
) {
  if (!value) {
    return "Não informado";
  }

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
  status:
    CheckoutPayment["status"],
) {
  const labels: Record<
    CheckoutPayment["status"],
    string
  > = {
    PENDING:
      "Aguardando pagamento",

    IN_PROCESS:
      "Pagamento em análise",

    APPROVED:
      "Pagamento aprovado",

    REJECTED:
      "Pagamento rejeitado",

    CANCELLED:
      "Pagamento cancelado",

    REFUNDED:
      "Pagamento reembolsado",

    CHARGED_BACK:
      "Pagamento contestado",
  };

  return labels[status];
}

function getStatusClass(
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

export function CustomerOrderDetailsPage() {
  const {
    number,
  } = useParams<{
    number: string;
  }>();

  const orderNumber =
    Number(number);

  const [
    order,
    setOrder,
  ] =
    useState<CustomerOrderDetails | null>(
      null,
    );

  const [
    payment,
    setPayment,
  ] =
    useState<CheckoutPayment | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    paymentError,
    setPaymentError,
  ] = useState("");

  const [
    refreshingPayment,
    setRefreshingPayment,
  ] = useState(false);

  const [
    generatingPayment,
    setGeneratingPayment,
  ] = useState(false);

  const [
    pixCopied,
    setPixCopied,
  ] = useState(false);

  const [
  paymentExpired,
  setPaymentExpired,
] = useState(false);

  const loadPayment =
    useCallback(async () => {
      if (
        !Number.isInteger(
          orderNumber,
        ) ||
        orderNumber <= 0
      ) {
        return;
      }

      try {
        const response =
          await apiRequest<
            LatestPaymentResponse
          >(
            `/orders/${orderNumber}/payment`,
          );

        setPayment(
          response.data.payment,
        );
      } catch (caughtError) {
        if (
          caughtError instanceof
            ApiError &&
          caughtError.status === 404
        ) {
          setPayment(null);

          return;
        }

        throw caughtError;
      }
    }, [orderNumber]);

  const loadOrder =
    useCallback(async () => {
      if (
        !Number.isInteger(
          orderNumber,
        ) ||
        orderNumber <= 0
      ) {
        setError(
          "Número de pedido inválido.",
        );

        setLoading(false);

        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await apiRequest<
            CustomerOrderDetailsResponse
          >(
            `/orders/${orderNumber}`,
          );

        setOrder(
          response.data.order,
        );

        await loadPayment();
      } catch (caughtError) {
        setOrder(null);

        setError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível carregar o pedido.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      loadPayment,
      orderNumber,
    ]);


    useEffect(() => {
  function checkExpiration() {
    if (!payment?.expiresAt) {
      setPaymentExpired(false);

      return;
    }

    setPaymentExpired(
      new Date(
        payment.expiresAt,
      ).getTime() <=
        Date.now(),
    );
  }

  const timeoutId =
    window.setTimeout(
      checkExpiration,
      0,
    );

  const intervalId =
    window.setInterval(
      checkExpiration,
      60_000,
    );

  return () => {
    window.clearTimeout(
      timeoutId,
    );

    window.clearInterval(
      intervalId,
    );
  };
}, [payment?.expiresAt]);

    

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadOrder();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadOrder]);

  async function refreshPayment() {
    setRefreshingPayment(true);
    setPaymentError("");

    try {
      await loadPayment();

      const response =
        await apiRequest<
          CustomerOrderDetailsResponse
        >(
          `/orders/${orderNumber}`,
        );

      setOrder(
        response.data.order,
      );
    } catch (caughtError) {
      setPaymentError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível atualizar o pagamento.",
      );
    } finally {
      setRefreshingPayment(false);
    }
  }

  async function generatePayment() {
    setGeneratingPayment(true);
    setPaymentError("");

    try {
      const response =
        await apiRequest<
          CreatePaymentResponse
        >(
          `/orders/${orderNumber}/payment`,
          {
            method: "POST",

            body: JSON.stringify({
              method: "PIX",
            }),
          },
        );

      setPayment(
        response.data.payment,
      );
    } catch (caughtError) {
      setPaymentError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível gerar o pagamento PIX.",
      );
    } finally {
      setGeneratingPayment(false);
    }
  }

  async function copyPixCode() {
    if (!payment?.pixQrCode) {
      return;
    }

    try {
      await navigator.clipboard
        .writeText(
          payment.pixQrCode,
        );

      setPixCopied(true);

      window.setTimeout(() => {
        setPixCopied(false);
      }, 2500);
    } catch {
      setPaymentError(
        "Não foi possível copiar o código PIX.",
      );
    }
  }

  if (loading) {
    return (
      <div className="customer-order-details-state">
        <LoaderCircle
          size={31}
          className="icon-spinning"
        />

        Carregando pedido...
      </div>
    );
  }

  if (
    error ||
    !order
  ) {
    return (
      <div className="customer-order-details-state">
        <ShoppingBag size={43} />

        <h1>
          Pedido não encontrado
        </h1>

        <p>
          {error ||
            "Não foi possível localizar este pedido."}
        </p>

        <Link to="/minha-conta/pedidos">
          <ArrowLeft size={18} />

          Voltar aos pedidos
        </Link>
      </div>
    );
  }

 

  const orderCanBePaid =
    order.status ===
      "PENDING_PAYMENT" ||
    order.status ===
      "PAYMENT_IN_REVIEW";



  const showPix =
    orderCanBePaid &&
    payment &&
    !paymentExpired &&
    Boolean(
      payment.pixQrCode ||
        payment.pixQrCodeBase64,
    );

  return (
    <section className="customer-order-details-page">
      <header className="customer-order-details-header">
        <div>
          <Link to="/minha-conta/pedidos">
            <ArrowLeft size={18} />

            Meus pedidos
          </Link>

          <span>
            DETALHES DO PEDIDO
          </span>

          <h1>
            Pedido #{order.number}
          </h1>

          <p>
            Realizado em{" "}
            {formatDate(
              order.dates.createdAt,
            )}
          </p>
        </div>

        <span
          className={`customer-order-details-status ${getStatusClass(
            order.status,
          )}`}
        >
          {formatOrderStatus(
            order.status,
          )}
        </span>
      </header>

      <div className="customer-order-details-grid">
        <div className="customer-order-details-main">
          {orderCanBePaid && (
            <section className="customer-order-payment-section">
              <header>
                <div>
                  <span>
                    PAGAMENTO
                  </span>

                  <h2>
                    Pagamento PIX
                  </h2>
                </div>

                {payment && (
                  <strong>
                    {formatPaymentStatus(
                      payment.status,
                    )}
                  </strong>
                )}
              </header>

              {paymentError && (
                <div className="customer-orders-error">
                  {paymentError}
                </div>
              )}

              {showPix &&
              payment ? (
                <div className="customer-order-pix-grid">
                  <div className="customer-order-pix-qr">
                    {payment.pixQrCodeBase64 ? (
                      <img
                        src={`data:image/png;base64,${payment.pixQrCodeBase64}`}
                        alt={`QR Code PIX do pedido ${order.number}`}
                      />
                    ) : (
                      <ImageIcon
                        size={40}
                      />
                    )}
                  </div>

                  <section className="customer-order-pix-information">
                    <div>
                      <span>
                        Valor
                      </span>

                      <strong>
                        {formatMoney(
                          payment.amountInCents,
                        )}
                      </strong>
                    </div>

                    <p>
                      Escaneie o QR Code
                      ou copie o código
                      PIX abaixo.
                    </p>

                    {payment.pixQrCode && (
                      <div className="customer-order-pix-copy">
                        <textarea
                          value={
                            payment.pixQrCode
                          }
                          readOnly
                          rows={4}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            void copyPixCode();
                          }}
                        >
                          {pixCopied ? (
                            <CheckCircle2
                              size={18}
                            />
                          ) : (
                            <Copy
                              size={18}
                            />
                          )}

                          {pixCopied
                            ? "Código copiado"
                            : "Copiar PIX"}
                        </button>
                      </div>
                    )}

                    <small>
                      Expira em{" "}
                      {formatDate(
                        payment.expiresAt,
                      )}
                    </small>

                    <div className="customer-order-pix-actions">
                      <button
                        type="button"
                        disabled={
                          refreshingPayment
                        }
                        onClick={() => {
                          void refreshPayment();
                        }}
                      >
                        {refreshingPayment ? (
                          <LoaderCircle
                            size={17}
                            className="icon-spinning"
                          />
                        ) : (
                          <RefreshCw
                            size={17}
                          />
                        )}

                        Atualizar status
                      </button>

                      {payment.ticketUrl && (
                        <a
                          href={
                            payment.ticketUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink
                            size={17}
                          />

                          Abrir Mercado Pago
                        </a>
                      )}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="customer-order-pix-unavailable">
                  <Clock3 size={31} />

                  <strong>
                    {paymentExpired
                      ? "O PIX anterior expirou."
                      : "Nenhum PIX ativo encontrado."}
                  </strong>

                  <p>
                    Gere um novo código
                    para concluir o
                    pagamento deste
                    pedido.
                  </p>

                  <button
                    type="button"
                    disabled={
                      generatingPayment
                    }
                    onClick={() => {
                      void generatePayment();
                    }}
                  >
                    {generatingPayment ? (
                      <>
                        <LoaderCircle
                          size={18}
                          className="icon-spinning"
                        />

                        Gerando PIX...
                      </>
                    ) : (
                      <>
                        Gerar novo PIX
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}

          {order.status ===
            "PAID" && (
            <section className="customer-order-paid-message">
              <CheckCircle2
                size={23}
              />

              <div>
                <strong>
                  Pagamento aprovado
                </strong>

                <span>
                  Seu pedido está pronto
                  para seguir para
                  preparação.
                </span>
              </div>
            </section>
          )}

          <section className="customer-order-products">
            <header>
              <ShoppingBag
                size={20}
              />

              <h2>
                Produtos
              </h2>

              <span>
                {order.items.reduce(
                  (
                    total,
                    item,
                  ) =>
                    total +
                    item.quantity,
                  0,
                )}
              </span>
            </header>

            <div>
              {order.items.map(
                (
                  item,
                  index,
                ) => (
                  <article
                    key={`${item.sku}-${index}`}
                  >
                    <div>
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
                          size={27}
                        />
                      )}
                    </div>

                    <section>
                      <strong>
                        {
                          item.productName
                        }
                      </strong>

                      <span>
                        {item.variantName ??
                          item.sku}
                      </span>

                      <small>
                        SKU: {item.sku}
                      </small>
                    </section>

                    <div>
                      <span>
                        {item.quantity} ×{" "}
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

          <section className="customer-order-shipping">
            <header>
              <Truck size={20} />

              <h2>
                Entrega
              </h2>
            </header>

            <div className="customer-order-shipping-grid">
              <article>
                <MapPin size={19} />

                <section>
                  <strong>
                    Endereço
                  </strong>

                  <span>
                    {
                      order
                        .shippingAddress
                        .recipient
                    }
                  </span>

                  <p>
                    {
                      order
                        .shippingAddress
                        .street
                    }
                    ,{" "}
                    {
                      order
                        .shippingAddress
                        .number
                    }

                    {order
                      .shippingAddress
                      .complement
                      ? `, ${order.shippingAddress.complement}`
                      : ""}
                  </p>

                  <small>
                    {
                      order
                        .shippingAddress
                        .district
                    }
                    {" — "}
                    {
                      order
                        .shippingAddress
                        .city
                    }
                    /{
                      order
                        .shippingAddress
                        .state
                    }
                  </small>
                </section>
              </article>

              <article>
                <PackageCheck
                  size={19}
                />

                <section>
                  <strong>
                    Rastreio
                  </strong>

                  {order.shipping
                    .trackingCode ? (
                    <>
                      <span>
                        {
                          order.shipping
                            .trackingCode
                        }
                      </span>

                      {order.shipping
                        .trackingUrl && (
                        <a
                          href={
                            order.shipping
                              .trackingUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Rastrear pedido
                        </a>
                      )}
                    </>
                  ) : (
                    <span>
                      Aguardando envio
                    </span>
                  )}
                </section>
              </article>
            </div>
          </section>
        </div>

        <aside className="customer-order-summary">
          <span>
            RESUMO
          </span>

          <h2>
            Pedido #{order.number}
          </h2>

          <div>
            <section>
              <span>
                Subtotal
              </span>

              <strong>
                {formatMoney(
                  order.totals
                    .subtotalInCents,
                )}
              </strong>
            </section>

            <section>
              <span>
                Desconto
              </span>

              <strong>
                {order.totals
                  .discountInCents >
                0
                  ? `- ${formatMoney(
                      order.totals
                        .discountInCents,
                    )}`
                  : formatMoney(0)}
              </strong>
            </section>

            <section>
              <span>Frete</span>

              <strong>
                {order.totals
                  .shippingInCents >
                0
                  ? formatMoney(
                      order.totals
                        .shippingInCents,
                    )
                  : "Grátis"}
              </strong>
            </section>

            <section>
              <span>Total</span>

              <strong>
                {formatMoney(
                  order.totals
                    .totalInCents,
                )}
              </strong>
            </section>
          </div>

          {order.coupon && (
            <div className="customer-order-coupon">
              Cupom utilizado:{" "}
              <strong>
                {order.coupon.code}
              </strong>
            </div>
          )}

          <div className="customer-order-dates">
            <div>
              <span>
                Criado
              </span>

              <strong>
                {formatDate(
                  order.dates
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
                  order.dates.paidAt,
                )}
              </strong>
            </div>

            <div>
              <span>
                Enviado
              </span>

              <strong>
                {formatDate(
                  order.dates
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
                  order.dates
                    .deliveredAt,
                )}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}