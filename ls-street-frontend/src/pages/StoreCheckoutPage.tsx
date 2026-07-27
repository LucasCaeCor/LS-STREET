import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Home,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
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
  Link,
  useNavigate,
} from "react-router";

import {
  useCart,
} from "../contexts/CartContext";

import {
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  AddressResponse,
  AddressesResponse,
  CheckoutAddress,
  CheckoutOrder,
  CheckoutPayment,
  CreateAddressInput,
  CreateCheckoutResponse,
  CreatePaymentResponse,
  LatestPaymentResponse,
  ValidateCouponResponse,
  ValidatedCoupon,
} from "../types/checkout";

interface AddressFormState {
  recipientName: string;
  phone: string;

  zipCode: string;
  street: string;
  number: string;

  complement: string;
  neighborhood: string;

  city: string;
  state: string;

  label: string;
  isDefault: boolean;
}

const initialAddressForm:
  AddressFormState = {
    recipientName: "",
    phone: "",

    zipCode: "",
    street: "",
    number: "",

    complement: "",
    neighborhood: "",

    city: "",
    state: "",

    label: "Casa",
    isDefault: false,
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
  value: string | null,
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

function formatZipCode(
  value: string,
) {
  const digits =
    value.replace(/\D/g, "")
      .slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(
    0,
    5,
  )}-${digits.slice(5)}`;
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

function getPaymentStatusClass(
  status:
    CheckoutPayment["status"],
) {
  if (status === "APPROVED") {
    return "approved";
  }

  if (
    status === "REJECTED" ||
    status === "CANCELLED" ||
    status === "CHARGED_BACK"
  ) {
    return "failed";
  }

  if (
    status === "REFUNDED"
  ) {
    return "refunded";
  }

  return "pending";
}

export function StoreCheckoutPage() {
  
    useNavigate();

  const {
    cart,
    loading: loadingCart,
    error: cartError,
    refreshCart,
  } = useCart();

  const [
    addresses,
    setAddresses,
  ] = useState<
    CheckoutAddress[]
  >([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState("");

  const [
    loadingAddresses,
    setLoadingAddresses,
  ] = useState(true);

  const [
    addressError,
    setAddressError,
  ] = useState("");

  const [
    showAddressForm,
    setShowAddressForm,
  ] = useState(false);

  const [
    addressForm,
    setAddressForm,
  ] =
    useState<AddressFormState>(
      initialAddressForm,
    );

  const [
    creatingAddress,
    setCreatingAddress,
  ] = useState(false);

  const [
    couponCode,
    setCouponCode,
  ] = useState("");

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] =
    useState<ValidatedCoupon | null>(
      null,
    );

  const [
    validatingCoupon,
    setValidatingCoupon,
  ] = useState(false);

  const [
    couponError,
    setCouponError,
  ] = useState("");

  const [
    processingCheckout,
    setProcessingCheckout,
  ] = useState(false);

  const [
    checkoutError,
    setCheckoutError,
  ] = useState("");

  const [
    createdOrder,
    setCreatedOrder,
  ] =
    useState<CheckoutOrder | null>(
      null,
    );

  const [
    payment,
    setPayment,
  ] =
    useState<CheckoutPayment | null>(
      null,
    );

  const [
    creatingPayment,
    setCreatingPayment,
  ] = useState(false);

  const [
    paymentError,
    setPaymentError,
  ] = useState("");

  const [
    refreshingPayment,
    setRefreshingPayment,
  ] = useState(false);

  const [
    pixCopied,
    setPixCopied,
  ] = useState(false);

  const subtotalInCents =
    cart?.summary
      .subtotalInCents ?? 0;

  const items =
    cart?.items ?? [];

  const hasUnavailableItems =
    items.some(
      (item) =>
        !item.isAvailable,
    );

  const effectiveCoupon =
    appliedCoupon &&
    appliedCoupon
      .subtotalInCents ===
      subtotalInCents
      ? appliedCoupon
      : null;

  const discountInCents =
    effectiveCoupon
      ?.discountInCents ?? 0;

  const shippingInCents = 0;

  const totalInCents =
    Math.max(
      0,

      subtotalInCents -
        discountInCents +
        shippingInCents,
    );

  const selectedAddress =
    useMemo(
      () =>
        addresses.find(
          (address) =>
            address.publicId ===
            selectedAddressId,
        ) ?? null,
      [
        addresses,
        selectedAddressId,
      ],
    );

  const loadAddresses =
    useCallback(async () => {
      setLoadingAddresses(true);
      setAddressError("");

      try {
        const response =
          await apiRequest<
            AddressesResponse
          >("/me/addresses");

        const loadedAddresses =
          response.data.addresses;

        setAddresses(
          loadedAddresses,
        );

        setSelectedAddressId(
          (current) => {
            const currentExists =
              loadedAddresses.some(
                (address) =>
                  address.publicId ===
                  current,
              );

            if (currentExists) {
              return current;
            }

            return (
              loadedAddresses.find(
                (address) =>
                  address.isDefault,
              )?.publicId ??
              loadedAddresses[0]
                ?.publicId ??
              ""
            );
          },
        );
      } catch (caughtError) {
        setAddresses([]);

        setAddressError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível carregar seus endereços.",
        );
      } finally {
        setLoadingAddresses(false);
      }
    }, []);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadAddresses();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadAddresses]);

  function updateAddressField(
    field:
      keyof AddressFormState,

    value:
      string | boolean,
  ) {
    setAddressForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function resetAddressForm() {
    setAddressForm(
      initialAddressForm,
    );

    setShowAddressForm(false);
    setAddressError("");
  }

  async function createAddress(
    event: FormEvent,
  ) {
    event.preventDefault();

    setAddressError("");
    setCreatingAddress(true);

    const payload:
      CreateAddressInput = {
        recipientName:
          addressForm
            .recipientName
            .trim(),

        phone:
          addressForm.phone
            .trim() || null,

        zipCode:
          addressForm.zipCode
            .trim(),

        street:
          addressForm.street
            .trim(),

        number:
          addressForm.number
            .trim(),

        complement:
          addressForm
            .complement
            .trim() || null,

        neighborhood:
          addressForm
            .neighborhood
            .trim(),

        city:
          addressForm.city
            .trim(),

        state:
          addressForm.state
            .trim()
            .toUpperCase(),

        country: "Brasil",

        label:
          addressForm.label
            .trim() || null,

        isDefault:
          addresses.length ===
            0 ||
          addressForm.isDefault,
      };

    try {
      const response =
        await apiRequest<
          AddressResponse
        >(
          "/me/addresses",
          {
            method: "POST",

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      await loadAddresses();

      setSelectedAddressId(
        response.data.address
          .publicId,
      );

      resetAddressForm();
    } catch (caughtError) {
      setAddressError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível cadastrar o endereço.",
      );
    } finally {
      setCreatingAddress(false);
    }
  }

  async function validateCoupon(
    event: FormEvent,
  ) {
    event.preventDefault();

    const normalizedCode =
      couponCode
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      setCouponError(
        "Informe o código do cupom.",
      );

      return;
    }

    if (
      subtotalInCents <= 0
    ) {
      setCouponError(
        "O carrinho está vazio.",
      );

      return;
    }

    setValidatingCoupon(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const response =
        await apiRequest<
          ValidateCouponResponse
        >(
          "/coupons/validate",
          {
            method: "POST",

            body:
              JSON.stringify({
                code:
                  normalizedCode,

                subtotalInCents,
              }),
          },
        );

      setAppliedCoupon(
        response.data,
      );

      setCouponCode(
        response.data
          .coupon.code,
      );
    } catch (caughtError) {
      setCouponError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível validar o cupom.",
      );
    } finally {
      setValidatingCoupon(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError("");
  }

  async function createPixPayment(
    orderNumber: number,
  ) {
    setCreatingPayment(true);
    setPaymentError("");

    try {
      const response =
        await apiRequest<
          CreatePaymentResponse
        >(
          `/orders/${orderNumber}/payment`,
          {
            method: "POST",

            body:
              JSON.stringify({
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
          : "O pedido foi criado, mas não foi possível gerar o PIX.",
      );
    } finally {
      setCreatingPayment(false);
    }
  }

  async function handleCheckout() {
    if (
      items.length === 0
    ) {
      setCheckoutError(
        "Seu carrinho está vazio.",
      );

      return;
    }

    if (hasUnavailableItems) {
      setCheckoutError(
        "Existem produtos indisponíveis no carrinho.",
      );

      return;
    }

    if (!selectedAddressId) {
      setCheckoutError(
        "Selecione um endereço de entrega.",
      );

      return;
    }

    setProcessingCheckout(true);
    setCheckoutError("");
    setPaymentError("");

    try {
      const response =
        await apiRequest<
          CreateCheckoutResponse
        >(
          "/checkout",
          {
            method: "POST",

            body:
              JSON.stringify({
                addressId:
                  selectedAddressId,

                ...(effectiveCoupon
                  ? {
                      couponCode:
                        effectiveCoupon
                          .coupon.code,
                    }
                  : {}),
              }),
          },
        );

      const order =
        response.data.order;

      setCreatedOrder(order);

      await refreshCart();

      await createPixPayment(
        order.number,
      );
    } catch (caughtError) {
      setCheckoutError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível concluir o pedido.",
      );
    } finally {
      setProcessingCheckout(false);
    }
  }

  async function refreshPaymentStatus() {
    if (!createdOrder) {
      return;
    }

    setRefreshingPayment(true);
    setPaymentError("");

    try {
      const response =
        await apiRequest<
          LatestPaymentResponse
        >(
          `/orders/${createdOrder.number}/payment`,
        );

      if (
        response.data.payment
      ) {
        setPayment(
          response.data.payment,
        );
      } else {
        setPaymentError(
          "Nenhum pagamento foi encontrado para este pedido.",
        );
      }
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

  async function copyPixCode() {
    if (!payment?.pixQrCode) {
      return;
    }

    try {
      await navigator
        .clipboard
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

  if (
    loadingCart ||
    loadingAddresses
  ) {
    return (
      <div className="store-checkout-state">
        <LoaderCircle
          size={31}
          className="icon-spinning"
        />

        <span>
          Preparando seu checkout...
        </span>
      </div>
    );
  }

  if (
    createdOrder
  ) {
    return (
      <section className="store-checkout-result">
        <header className="store-checkout-result-header">
          <div>
            <PackageCheck
              size={31}
            />
          </div>

          <span>
            PEDIDO CRIADO
          </span>

          <h1>
            Pedido #
            {createdOrder.number}
          </h1>

          <p>
            Seu pedido foi registrado.
            Finalize o pagamento PIX
            para continuarmos a
            preparação.
          </p>
        </header>

        <div className="store-checkout-result-grid">
          <section className="store-checkout-payment-panel">
            <header>
              <div>
                <span>
                  PAGAMENTO
                </span>

                <h2>PIX</h2>
              </div>

              {payment && (
                <span
                  className={`store-checkout-payment-status ${getPaymentStatusClass(
                    payment.status,
                  )}`}
                >
                  {formatPaymentStatus(
                    payment.status,
                  )}
                </span>
              )}
            </header>

            {paymentError && (
              <div className="store-checkout-error">
                {paymentError}
              </div>
            )}

            {creatingPayment ? (
              <div className="store-checkout-payment-loading">
                <LoaderCircle
                  size={29}
                  className="icon-spinning"
                />

                Gerando pagamento PIX...
              </div>
            ) : payment ? (
              <>
                {payment
                  .pixQrCodeBase64 && (
                  <div className="store-checkout-qr-code">
                    <img
                      src={`data:image/png;base64,${payment.pixQrCodeBase64}`}
                      alt={`QR Code PIX do pedido ${createdOrder.number}`}
                    />
                  </div>
                )}

                <div className="store-checkout-pix-value">
                  <span>
                    Valor do PIX
                  </span>

                  <strong>
                    {formatMoney(
                      payment
                        .amountInCents,
                    )}
                  </strong>
                </div>

                {payment.pixQrCode && (
                  <div className="store-checkout-pix-copy">
                    <span>
                      PIX copia e cola
                    </span>

                    <div>
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
                          ? "Copiado"
                          : "Copiar código"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="store-checkout-payment-details">
                  <div>
                    <span>
                      Referência
                    </span>

                    <strong>
                      {payment.externalReference ??
                        `ORDER-${createdOrder.number}`}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Expiração
                    </span>

                    <strong>
                      {formatDate(
                        payment.expiresAt,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="store-checkout-payment-actions">
                  <button
                    type="button"
                    onClick={() => {
                      void refreshPaymentStatus();
                    }}
                    disabled={
                      refreshingPayment
                    }
                  >
                    {refreshingPayment ? (
                      <LoaderCircle
                        size={18}
                        className="icon-spinning"
                      />
                    ) : (
                      <RefreshCw
                        size={18}
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
                        size={18}
                      />

                      Abrir Mercado Pago
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="store-checkout-payment-retry">
                <p>
                  O pedido foi criado,
                  mas o PIX ainda não
                  foi gerado.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void createPixPayment(
                      createdOrder.number,
                    );
                  }}
                >
                  Gerar PIX novamente
                </button>
              </div>
            )}
          </section>

          <aside className="store-checkout-finished-summary">
            <span>
              RESUMO DO PEDIDO
            </span>

            <h2>
              Pedido #
              {createdOrder.number}
            </h2>

            <div className="store-checkout-finished-items">
              {createdOrder.items.map(
                (item) => (
                  <article
                    key={item.id}
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
                        <ShoppingBag
                          size={21}
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
                        {item.quantity} ×{" "}
                        {formatMoney(
                          item
                            .unitPriceInCents,
                        )}
                      </small>
                    </section>

                    <strong>
                      {formatMoney(
                        item.totalInCents,
                      )}
                    </strong>
                  </article>
                ),
              )}
            </div>

            <div className="store-checkout-finished-values">
              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  {formatMoney(
                    createdOrder
                      .subtotalInCents,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Desconto
                </span>

                <strong>
                  {createdOrder
                    .discountInCents >
                  0
                    ? `- ${formatMoney(
                        createdOrder
                          .discountInCents,
                      )}`
                    : formatMoney(0)}
                </strong>
              </div>

              <div>
                <span>
                  Frete
                </span>

                <strong>
                  Grátis
                </strong>
              </div>

              <div>
                <span>
                  Total
                </span>

                <strong>
                  {formatMoney(
                    createdOrder
                      .totalInCents,
                  )}
                </strong>
              </div>
            </div>

            <div className="store-checkout-shipping-result">
              <MapPin size={19} />

              <div>
                <strong>
                  Entrega para
                </strong>

                <span>
                  {
                    createdOrder.recipient
                  }
                </span>

                <p>
                  {
                    createdOrder
                      .shippingStreet
                  }
                  ,{" "}
                  {
                    createdOrder
                      .shippingNumber
                  }
                  {" — "}
                  {
                    createdOrder
                      .shippingDistrict
                  }
                </p>

                <small>
                  {
                    createdOrder
                      .shippingCity
                  }
                  {" - "}
                  {
                    createdOrder
                      .shippingState
                  }
                </small>
              </div>
            </div>

            <Link
              to="/"
              className="store-checkout-return-store"
            >
              Voltar para a loja

              <ArrowRight
                size={18}
              />
            </Link>
          </aside>
        </div>
      </section>
    );
  }

  if (
    items.length === 0
  ) {
    return (
      <div className="store-checkout-state">
        <ShoppingBag size={46} />

        <h1>
          Seu carrinho está vazio.
        </h1>

        <p>
          Adicione produtos antes de
          iniciar o checkout.
        </p>

        <Link to="/">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <section className="store-checkout-page">
      <header className="store-checkout-header">
        <div>
          <span>
            FINALIZAR COMPRA
          </span>

          <h1>Checkout</h1>

          <p>
            Confirme a entrega,
            aplique seu cupom e
            finalize com PIX.
          </p>
        </div>

        <Link to="/carrinho">
          <ArrowLeft size={18} />
          Voltar ao carrinho
        </Link>
      </header>

      {(cartError ||
        checkoutError) && (
        <div className="store-checkout-error">
          {cartError ||
            checkoutError}
        </div>
      )}

      <div className="store-checkout-grid">
        <div className="store-checkout-main">
          <section className="store-checkout-section">
            <header className="store-checkout-section-header">
              <div>
                <span>1</span>

                <section>
                  <h2>
                    Endereço de entrega
                  </h2>

                  <p>
                    Escolha onde seu
                    pedido será
                    entregue.
                  </p>
                </section>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddressForm(
                    (current) =>
                      !current,
                  )
                }
              >
                {showAddressForm ? (
                  <X size={18} />
                ) : (
                  <Plus size={18} />
                )}

                {showAddressForm
                  ? "Cancelar"
                  : "Novo endereço"}
              </button>
            </header>

            {addressError && (
              <div className="store-checkout-error">
                {addressError}
              </div>
            )}

            {showAddressForm && (
              <form
                className="store-checkout-address-form"
                onSubmit={
                  createAddress
                }
              >
                <label className="store-checkout-field-wide">
                  <span>
                    Nome do
                    destinatário
                  </span>

                  <input
                    value={
                      addressForm
                        .recipientName
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "recipientName",

                        event.target
                          .value,
                      )
                    }
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  <span>
                    Telefone
                  </span>

                  <input
                    value={
                      addressForm.phone
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "phone",

                        event.target
                          .value,
                      )
                    }
                    maxLength={20}
                    placeholder="(00) 00000-0000"
                  />
                </label>

                <label>
                  <span>CEP</span>

                  <input
                    value={
                      addressForm
                        .zipCode
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "zipCode",

                        formatZipCode(
                          event.target
                            .value,
                        ),
                      )
                    }
                    minLength={8}
                    maxLength={9}
                    placeholder="00000-000"
                    required
                  />
                </label>

                <label className="store-checkout-field-wide">
                  <span>Rua</span>

                  <input
                    value={
                      addressForm.street
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "street",

                        event.target
                          .value,
                      )
                    }
                    minLength={2}
                    maxLength={160}
                    required
                  />
                </label>

                <label>
                  <span>Número</span>

                  <input
                    value={
                      addressForm.number
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "number",

                        event.target
                          .value,
                      )
                    }
                    maxLength={30}
                    required
                  />
                </label>

                <label>
                  <span>
                    Complemento
                  </span>

                  <input
                    value={
                      addressForm
                        .complement
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "complement",

                        event.target
                          .value,
                      )
                    }
                    maxLength={120}
                    placeholder="Opcional"
                  />
                </label>

                <label>
                  <span>Bairro</span>

                  <input
                    value={
                      addressForm
                        .neighborhood
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "neighborhood",

                        event.target
                          .value,
                      )
                    }
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  <span>Cidade</span>

                  <input
                    value={
                      addressForm.city
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "city",

                        event.target
                          .value,
                      )
                    }
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  <span>UF</span>

                  <input
                    value={
                      addressForm.state
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "state",

                        event.target
                          .value
                          .toUpperCase()
                          .slice(0, 2),
                      )
                    }
                    minLength={2}
                    maxLength={2}
                    placeholder="SP"
                    required
                  />
                </label>

                <label>
                  <span>
                    Identificação
                  </span>

                  <input
                    value={
                      addressForm.label
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "label",

                        event.target
                          .value,
                      )
                    }
                    maxLength={40}
                    placeholder="Casa, Trabalho..."
                  />
                </label>

                <label className="store-checkout-address-default">
                  <input
                    type="checkbox"
                    checked={
                      addressForm
                        .isDefault
                    }
                    onChange={(
                      event,
                    ) =>
                      updateAddressField(
                        "isDefault",

                        event.target
                          .checked,
                      )
                    }
                  />

                  <span>
                    Tornar este meu
                    endereço padrão
                  </span>
                </label>

                <div className="store-checkout-address-form-actions">
                  <button
                    type="button"
                    onClick={
                      resetAddressForm
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      creatingAddress
                    }
                  >
                    {creatingAddress ? (
                      <>
                        <LoaderCircle
                          size={18}
                          className="icon-spinning"
                        />

                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={18}
                        />

                        Salvar endereço
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 &&
            !showAddressForm ? (
              <div className="store-checkout-no-address">
                <MapPin size={33} />

                <strong>
                  Nenhum endereço
                  cadastrado.
                </strong>

                <span>
                  Cadastre um endereço
                  para continuar.
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddressForm(
                      true,
                    )
                  }
                >
                  Cadastrar endereço
                </button>
              </div>
            ) : (
              <div className="store-checkout-addresses">
                {addresses.map(
                  (address) => (
                    <button
                      type="button"
                      key={
                        address.publicId
                      }
                      className={
                        selectedAddressId ===
                        address.publicId
                          ? "store-checkout-address-card selected"
                          : "store-checkout-address-card"
                      }
                      onClick={() =>
                        setSelectedAddressId(
                          address.publicId,
                        )
                      }
                    >
                      <div className="store-checkout-address-check">
                        {selectedAddressId ===
                          address.publicId && (
                          <CheckCircle2
                            size={19}
                          />
                        )}
                      </div>

                      <MapPin size={20} />

                      <section>
                        <header>
                          <strong>
                            {address.label ??
                              "Endereço"}
                          </strong>

                          {address.isDefault && (
                            <span>
                              Padrão
                            </span>
                          )}
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
                          {" — "}
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
                      </section>
                    </button>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="store-checkout-section">
            <header className="store-checkout-section-header">
              <div>
                <span>2</span>

                <section>
                  <h2>
                    Cupom de desconto
                  </h2>

                  <p>
                    Possui um cupom?
                    Valide antes de
                    finalizar.
                  </p>
                </section>
              </div>
            </header>

            <form
              className="store-checkout-coupon-form"
              onSubmit={
                validateCoupon
              }
            >
              <Tag size={19} />

              <input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(
                    event.target
                      .value
                      .toUpperCase(),
                  );

                  setCouponError("");
                }}
                maxLength={30}
                placeholder="DIGITE SEU CUPOM"
                disabled={
                  validatingCoupon
                }
              />

              {effectiveCoupon ? (
                <button
                  type="button"
                  onClick={
                    removeCoupon
                  }
                >
                  <X size={18} />
                  Remover
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    validatingCoupon
                  }
                >
                  {validatingCoupon ? (
                    <LoaderCircle
                      size={18}
                      className="icon-spinning"
                    />
                  ) : (
                    <Tag size={18} />
                  )}

                  Aplicar
                </button>
              )}
            </form>

            {couponError && (
              <div className="store-checkout-error">
                {couponError}
              </div>
            )}

            {effectiveCoupon && (
              <div className="store-checkout-coupon-success">
                <CheckCircle2
                  size={20}
                />

                <div>
                  <strong>
                    Cupom{" "}
                    {
                      effectiveCoupon
                        .coupon.code
                    }{" "}
                    aplicado
                  </strong>

                  <span>
                    {effectiveCoupon
                      .coupon
                      .description ??
                      "Desconto aplicado ao pedido."}
                  </span>

                  {effectiveCoupon
                    .discountInCents >
                    0 && (
                    <small>
                      Você economizou{" "}
                      {formatMoney(
                        effectiveCoupon
                          .discountInCents,
                      )}
                    </small>
                  )}

                  {effectiveCoupon
                    .freeShipping && (
                    <small>
                      Frete grátis
                      aplicado.
                    </small>
                  )}
                </div>
              </div>
            )}

            {appliedCoupon &&
              !effectiveCoupon && (
                <div className="store-checkout-coupon-changed">
                  O valor do carrinho
                  mudou. Aplique o
                  cupom novamente.
                </div>
              )}
          </section>

          <section className="store-checkout-section">
            <header className="store-checkout-section-header">
              <div>
                <span>3</span>

                <section>
                  <h2>
                    Forma de pagamento
                  </h2>

                  <p>
                    Nesta etapa, o
                    pagamento disponível
                    é PIX.
                  </p>
                </section>
              </div>
            </header>

            <div className="store-checkout-payment-method selected">
              <div>
                <strong>PIX</strong>
                <span>
                  Aprovação rápida pelo
                  Mercado Pago
                </span>
              </div>

              <CheckCircle2
                size={21}
              />
            </div>
          </section>
        </div>

        <aside className="store-checkout-summary">
          <span className="store-checkout-summary-eyebrow">
            SEU PEDIDO
          </span>

          <h2>
            Resumo da compra
          </h2>

          <div className="store-checkout-summary-items">
            {items.map(
              (item) => (
                <article
                  key={item.id}
                >
                  <div>
                    {item.product
                      .image ? (
                      <img
                        src={
                          item.product
                            .image.url
                        }
                        alt={
                          item.product
                            .image
                            .altText ??
                          item.product
                            .name
                        }
                      />
                    ) : (
                      <ShoppingBag
                        size={21}
                      />
                    )}

                    <span>
                      {item.quantity}
                    </span>
                  </div>

                  <section>
                    <strong>
                      {
                        item.product
                          .name
                      }
                    </strong>

                    <span>
                      {[
                        item.variant
                          .color,
                        item.variant
                          .size,
                      ]
                        .filter(Boolean)
                        .join(" · ") ||
                        item.variant
                          .sku}
                    </span>
                  </section>

                  <strong>
                    {formatMoney(
                      item.totalInCents,
                    )}
                  </strong>
                </article>
              ),
            )}
          </div>

          <div className="store-checkout-summary-values">
            <div>
              <span>
                Subtotal
              </span>

              <strong>
                {formatMoney(
                  subtotalInCents,
                )}
              </strong>
            </div>

            <div>
              <span>
                Desconto
              </span>

              <strong
                className={
                  discountInCents > 0
                    ? "discount"
                    : ""
                }
              >
                {discountInCents > 0
                  ? `- ${formatMoney(
                      discountInCents,
                    )}`
                  : formatMoney(0)}
              </strong>
            </div>

            <div>
              <span>Frete</span>

              <strong className="free">
                Grátis
              </strong>
            </div>

            <div className="store-checkout-summary-total">
              <span>Total</span>

              <strong>
                {formatMoney(
                  totalInCents,
                )}
              </strong>
            </div>
          </div>

          {selectedAddress && (
            <div className="store-checkout-selected-address">
              <Home size={18} />

              <div>
                <strong>
                  Entrega selecionada
                </strong>

                <span>
                  {
                    selectedAddress
                      .street
                  }
                  ,{" "}
                  {
                    selectedAddress
                      .number
                  }
                  {" — "}
                  {
                    selectedAddress.city
                  }
                  /{
                    selectedAddress.state
                  }
                </span>
              </div>
            </div>
          )}

          {hasUnavailableItems && (
            <div className="store-checkout-error">
              Existem produtos
              indisponíveis no
              carrinho.
            </div>
          )}

          <button
            type="button"
            className="store-checkout-finish-button"
            disabled={
              processingCheckout ||
              !selectedAddressId ||
              hasUnavailableItems
            }
            onClick={() => {
              void handleCheckout();
            }}
          >
            {processingCheckout ? (
              <>
                <LoaderCircle
                  size={20}
                  className="icon-spinning"
                />

                Criando pedido...
              </>
            ) : (
              <>
                Finalizar e gerar PIX

                <ArrowRight
                  size={20}
                />
              </>
            )}
          </button>

          <div className="store-checkout-security">
            <article>
              <ShieldCheck
                size={19}
              />

              <div>
                <strong>
                  Compra segura
                </strong>

                <span>
                  Seus dados são
                  protegidos.
                </span>
              </div>
            </article>

            <article>
              <Truck size={19} />

              <div>
                <strong>
                  Frete grátis
                </strong>

                <span>
                  Entrega para todo o
                  Brasil.
                </span>
              </div>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}