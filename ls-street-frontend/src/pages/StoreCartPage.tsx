import {
  ArrowLeft,
  ArrowRight,
  LoaderCircle,
  Minus,
  PackageX,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router";

import {
  useCart,
} from "../contexts/CartContext";

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

export function StoreCartPage() {
  const navigate =
    useNavigate();

  const {
    cart,
    loading,
    error,

    updateItem,
    removeItem,
    clearCart,
  } = useCart();

  const [
    pendingItemId,
    setPendingItemId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    clearing,
    setClearing,
  ] = useState(false);

  const items =
    cart?.items ?? [];

  const subtotal =
    cart?.summary
      .subtotalInCents ?? 0;

  const hasUnavailableItems =
    items.some(
      (item) =>
        !item.isAvailable,
    );

  const canCheckout =
    items.length > 0 &&
    !hasUnavailableItems;

  async function changeQuantity(
    itemId: string,
    quantity: number,
  ) {
    setPendingItemId(
      itemId,
    );

    await updateItem(
      itemId,
      quantity,
    );

    setPendingItemId(null);
  }

  async function handleRemove(
    itemId: string,
  ) {
    setPendingItemId(
      itemId,
    );

    await removeItem(
      itemId,
    );

    setPendingItemId(null);
  }

  async function handleClear() {
    const confirmed =
      window.confirm(
        "Tem certeza que deseja limpar o carrinho?",
      );

    if (!confirmed) {
      return;
    }

    setClearing(true);

    await clearCart();

    setClearing(false);
  }

  if (loading) {
    return (
      <div className="store-cart-page-state">
        <LoaderCircle
          size={31}
          className="icon-spinning"
        />

        Carregando carrinho...
      </div>
    );
  }

  return (
    <section className="store-cart-page">
      <header className="store-cart-page-header">
        <div>
          <span>
            SUA COMPRA
          </span>

          <h1>
            Carrinho
          </h1>

          <p>
            Revise seus produtos antes
            de continuar.
          </p>
        </div>

        <Link to="/">
          <ArrowLeft size={18} />
          Continuar comprando
        </Link>
      </header>

      {error && (
        <div className="store-cart-page-error">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="store-cart-page-empty">
          <ShoppingBag
            size={50}
          />

          <h2>
            Seu carrinho está vazio.
          </h2>

          <p>
            Adicione produtos para
            continuar sua compra.
          </p>

          <Link to="/">
            Explorar produtos

            <ArrowRight
              size={18}
            />
          </Link>
        </div>
      ) : (
        <div className="store-cart-page-grid">
          <div className="store-cart-page-items">
            <header>
              <span>
                {
                  cart?.summary
                    .uniqueItems
                }{" "}
                {cart?.summary
                  .uniqueItems === 1
                  ? "item"
                  : "itens"}
              </span>

              <button
                type="button"
                onClick={() => {
                  void handleClear();
                }}
                disabled={clearing}
              >
                {clearing ? (
                  <LoaderCircle
                    size={16}
                    className="icon-spinning"
                  />
                ) : (
                  <Trash2
                    size={16}
                  />
                )}

                Limpar carrinho
              </button>
            </header>

            {items.map(
              (item) => {
                const pending =
                  pendingItemId ===
                  item.id;

                return (
                  <article
                    key={item.id}
                    className={
                      item.isAvailable
                        ? "store-cart-page-item"
                        : "store-cart-page-item unavailable"
                    }
                  >
                    <Link
                      to={`/produto/${item.product.slug}`}
                      className="store-cart-page-item-image"
                    >
                      {item.product
                        .image ? (
                        <img
                          src={
                            item
                              .product
                              .image
                              .url
                          }
                          alt={
                            item
                              .product
                              .image
                              .altText ??
                            item
                              .product
                              .name
                          }
                        />
                      ) : (
                        <PackageX
                          size={31}
                        />
                      )}
                    </Link>

                    <section className="store-cart-page-item-info">
                      <span>
                        PRODUTO
                      </span>

                      <Link
                        to={`/produto/${item.product.slug}`}
                      >
                        {
                          item.product
                            .name
                        }
                      </Link>

                      <p>
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
                      </p>

                      <small>
                        SKU:{" "}
                        {
                          item.variant
                            .sku
                        }
                      </small>

                      {!item.isAvailable && (
                        <strong className="store-cart-page-item-warning">
                          Produto
                          indisponível ou
                          quantidade acima
                          do estoque.
                        </strong>
                      )}
                    </section>

                    <section className="store-cart-page-item-price">
                      <span>
                        Preço unitário
                      </span>

                      {item.variant
                        .compareAtPriceInCents !==
                        null &&
                        item.variant
                          .compareAtPriceInCents >
                          item
                            .unitPriceInCents && (
                          <small>
                            {formatMoney(
                              item
                                .variant
                                .compareAtPriceInCents,
                            )}
                          </small>
                        )}

                      <strong>
                        {formatMoney(
                          item.unitPriceInCents,
                        )}
                      </strong>
                    </section>

                    <section className="store-cart-page-item-quantity">
                      <span>
                        Quantidade
                      </span>

                      <div>
                        <button
                          type="button"
                          disabled={
                            pending ||
                            item.quantity <=
                              1
                          }
                          onClick={() => {
                            void changeQuantity(
                              item.id,
                              item.quantity -
                                1,
                            );
                          }}
                        >
                          <Minus
                            size={17}
                          />
                        </button>

                        <strong>
                          {pending ? (
                            <LoaderCircle
                              size={17}
                              className="icon-spinning"
                            />
                          ) : (
                            item.quantity
                          )}
                        </strong>

                        <button
                          type="button"
                          disabled={
                            pending ||
                            !item.isAvailable ||
                            item.quantity >=
                              item.availableStock
                          }
                          onClick={() => {
                            void changeQuantity(
                              item.id,
                              item.quantity +
                                1,
                            );
                          }}
                        >
                          <Plus
                            size={17}
                          />
                        </button>
                      </div>

                      <small>
                        {item.availableStock}{" "}
                        disponíveis
                      </small>
                    </section>

                    <section className="store-cart-page-item-total">
                      <span>
                        Total
                      </span>

                      <strong>
                        {formatMoney(
                          item.totalInCents,
                        )}
                      </strong>

                      <button
                        type="button"
                        disabled={
                          pending
                        }
                        onClick={() => {
                          void handleRemove(
                            item.id,
                          );
                        }}
                      >
                        <Trash2
                          size={16}
                        />

                        Remover
                      </button>
                    </section>
                  </article>
                );
              },
            )}
          </div>

          <aside className="store-cart-summary">
            <span className="store-cart-summary-eyebrow">
              RESUMO
            </span>

            <h2>
              Resumo da compra
            </h2>

            <div className="store-cart-summary-values">
              <div>
                <span>
                  Produtos
                </span>

                <strong>
                  {formatMoney(
                    subtotal,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Frete
                </span>

                <strong>
                  Calculado no
                  checkout
                </strong>
              </div>

              <div className="store-cart-summary-total">
                <span>
                  Subtotal
                </span>

                <strong>
                  {formatMoney(
                    subtotal,
                  )}
                </strong>
              </div>
            </div>

            {hasUnavailableItems && (
              <div className="store-cart-summary-warning">
                Existem produtos
                indisponíveis no
                carrinho. Ajuste os
                itens antes de
                continuar.
              </div>
            )}

            <button
              type="button"
              className="store-cart-summary-checkout"
              disabled={
                !canCheckout
              }
              onClick={() =>
                navigate(
                  "/checkout",
                )
              }
            >
              Ir para checkout

              <ArrowRight
                size={18}
              />
            </button>

            <div className="store-cart-summary-benefits">
              <article>
                <ShieldCheck
                  size={19}
                />

                <div>
                  <strong>
                    Compra segura
                  </strong>

                  <span>
                    Seus dados
                    protegidos
                  </span>
                </div>
              </article>

              <article>
                <Truck
                  size={19}
                />

                <div>
                  <strong>
                    Entrega nacional
                  </strong>

                  <span>
                    Enviamos para todo
                    o Brasil
                  </span>
                </div>
              </article>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}