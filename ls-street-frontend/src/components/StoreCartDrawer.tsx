import {
  ArrowRight,
  LoaderCircle,
  Minus,
  PackageX,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
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

export function StoreCartDrawer() {
  const {
    cart,
    loading,
    error,

    drawerOpen,
    closeCart,

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

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    return () => {
      document.body.style
        .overflow =
        previousOverflow;
    };
  }, [drawerOpen]);

  if (!drawerOpen) {
    return null;
  }

  const items =
    cart?.items ?? [];

  const totalQuantity =
    cart?.summary
      .totalQuantity ?? 0;

  const subtotal =
    cart?.summary
      .subtotalInCents ?? 0;

  const hasUnavailableItems =
    items.some(
      (item) =>
        !item.isAvailable,
    );

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
        "Remover todos os produtos do carrinho?",
      );

    if (!confirmed) {
      return;
    }

    setClearing(true);

    await clearCart();

    setClearing(false);
  }

  return (
    <div
      className="store-cart-drawer-backdrop"
      onMouseDown={closeCart}
    >
      <aside
        className="store-cart-drawer"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="store-cart-drawer-header">
          <div>
            <span>
              SEU CARRINHO
            </span>

            <h2>
              Carrinho
            </h2>

            <p>
              {totalQuantity}{" "}
              {totalQuantity === 1
                ? "produto"
                : "produtos"}
            </p>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
          >
            <X size={22} />
          </button>
        </header>

        {error && (
          <div className="store-cart-drawer-error">
            {error}
          </div>
        )}

        <div className="store-cart-drawer-content">
          {loading ? (
            <div className="store-cart-drawer-state">
              <LoaderCircle
                size={29}
                className="icon-spinning"
              />

              Carregando carrinho...
            </div>
          ) : items.length === 0 ? (
            <div className="store-cart-drawer-state">
              <ShoppingBag
                size={42}
              />

              <strong>
                Seu carrinho está
                vazio.
              </strong>

              <span>
                Explore os produtos
                da LS STREET.
              </span>

              <Link
                to="/"
                onClick={closeCart}
              >
                Ver produtos
              </Link>
            </div>
          ) : (
            <div className="store-cart-drawer-items">
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
                          ? "store-cart-drawer-item"
                          : "store-cart-drawer-item unavailable"
                      }
                    >
                      <Link
                        to={`/produto/${item.product.slug}`}
                        className="store-cart-drawer-image"
                        onClick={
                          closeCart
                        }
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
                            size={24}
                          />
                        )}
                      </Link>

                      <section className="store-cart-drawer-item-content">
                        <header>
                          <div>
                            <Link
                              to={`/produto/${item.product.slug}`}
                              onClick={
                                closeCart
                              }
                            >
                              {
                                item
                                  .product
                                  .name
                              }
                            </Link>

                            <span>
                              {[
                                item
                                  .variant
                                  .color,
                                item
                                  .variant
                                  .size,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  " · ",
                                ) ||
                                item
                                  .variant
                                  .sku}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              void handleRemove(
                                item.id,
                              );
                            }}
                            disabled={
                              pending
                            }
                            aria-label="Remover produto"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </header>

                        {!item.isAvailable && (
                          <span className="store-cart-unavailable-message">
                            Item indisponível
                            ou sem estoque.
                          </span>
                        )}

                        <footer>
                          <div className="store-cart-mini-quantity">
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
                                size={15}
                              />
                            </button>

                            <strong>
                              {pending ? (
                                <LoaderCircle
                                  size={15}
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
                                size={15}
                              />
                            </button>
                          </div>

                          <strong>
                            {formatMoney(
                              item.totalInCents,
                            )}
                          </strong>
                        </footer>
                      </section>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="store-cart-drawer-footer">
            <div className="store-cart-drawer-subtotal">
              <span>
                Subtotal
              </span>

              <strong>
                {formatMoney(
                  subtotal,
                )}
              </strong>
            </div>

            <p>
              Frete e descontos serão
              calculados no checkout.
            </p>

            {hasUnavailableItems && (
              <div className="store-cart-checkout-warning">
                Remova ou ajuste os
                itens indisponíveis
                para continuar.
              </div>
            )}

            <Link
              to="/carrinho"
              className="store-cart-view-button"
              onClick={closeCart}
            >
              Ver carrinho completo
            </Link>

            <Link
              to="/checkout"
              className={
                hasUnavailableItems
                  ? "store-cart-checkout-button disabled"
                  : "store-cart-checkout-button"
              }
              onClick={(event) => {
                if (
                  hasUnavailableItems
                ) {
                  event.preventDefault();

                  return;
                }

                closeCart();
              }}
            >
              Ir para checkout

              <ArrowRight
                size={18}
              />
            </Link>

            <button
              type="button"
              className="store-cart-clear-button"
              onClick={() => {
                void handleClear();
              }}
              disabled={clearing}
            >
              {clearing ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="icon-spinning"
                  />

                  Limpando...
                </>
              ) : (
                <>
                  <Trash2
                    size={16}
                  />

                  Limpar carrinho
                </>
              )}
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}