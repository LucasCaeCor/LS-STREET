import {
  ArrowLeft,
  Heart,
  ImageIcon,
  LoaderCircle,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
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
} from "../lib/api";

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

export function CustomerFavoritesPage() {
  const {
    favorites,
    loading,
    error,
    isToggling,
    toggleFavorite,
  } = useFavorites();

  const [
    actionError,
    setActionError,
  ] = useState("");

  async function removeFavorite(
    productPublicId: string,
  ) {
    setActionError("");

    try {
      await toggleFavorite(
        productPublicId,
      );
    } catch (caughtError) {
      setActionError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível remover o produto dos favoritos.",
      );
    }
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
            Todos os produtos que você
            guardou para conferir depois.
          </p>
        </div>

        <Link to="/minha-conta">
          <ArrowLeft size={18} />
          Voltar para minha conta
        </Link>
      </header>

      {(error || actionError) && (
        <div className="customer-favorites-error">
          {actionError || error}
        </div>
      )}

      {loading ? (
        <div className="customer-favorites-state">
          <LoaderCircle
            size={32}
            className="icon-spinning"
          />

          <span>
            Carregando seus favoritos...
          </span>
        </div>
      ) : favorites.length === 0 ? (
        <div className="customer-favorites-state">
          <Heart size={48} />

          <h2>
            Você ainda não possui
            favoritos.
          </h2>

          <p>
            Clique no coração dos
            produtos para guardá-los
            nesta página.
          </p>

          <Link to="/">
            <ShoppingBag size={17} />
            Explorar produtos
          </Link>
        </div>
      ) : (
        <div className="customer-favorites-grid">
          {favorites.map(
            (favorite) => {
              const {
                product,
              } = favorite;

              const removing =
                isToggling(
                  product.publicId,
                );

              return (
                <article
                  key={favorite.id}
                  className="customer-favorite-card"
                >
                  <Link
                    to={`/produto/${product.slug}`}
                    className="customer-favorite-image"
                  >
                    {product.image ? (
                      <img
                        src={
                          product.image.url
                        }
                        alt={
                          product.image
                            .altText ??
                          product.name
                        }
                      />
                    ) : (
                      <ImageIcon
                        size={38}
                      />
                    )}

                    {!product.available && (
                      <span>
                        ESGOTADO
                      </span>
                    )}
                  </Link>

                  <section className="customer-favorite-content">
                    <span className="customer-favorite-category">
                      {
                        product.category
                          .name
                      }
                    </span>

                    <h2>
                      <Link
                        to={`/produto/${product.slug}`}
                      >
                        {product.name}
                      </Link>
                    </h2>

                    <p>
                      {product.shortDescription ??
                        "Streetwear autêntico LS STREET."}
                    </p>

                    <div className="customer-favorite-information">
                      <div>
                        <span>
                          Preço
                        </span>

                        <strong>
                          {product.minimumPriceInCents !==
                          null
                            ? `A partir de ${formatMoney(
                                product.minimumPriceInCents,
                              )}`
                            : "Indisponível"}
                        </strong>
                      </div>

                      <span
                        className={
                          product.available
                            ? "customer-favorite-availability available"
                            : "customer-favorite-availability unavailable"
                        }
                      >
                        {product.available
                          ? "Disponível"
                          : "Sem estoque"}
                      </span>
                    </div>

                    <footer>
                      <Link
                        to={`/produto/${product.slug}`}
                      >
                        Ver produto
                      </Link>

                      <button
                        type="button"
                        disabled={
                          removing
                        }
                        onClick={() => {
                          void removeFavorite(
                            product.publicId,
                          );
                        }}
                      >
                        {removing ? (
                          <LoaderCircle
                            size={16}
                            className="icon-spinning"
                          />
                        ) : (
                          <Trash2
                            size={16}
                          />
                        )}

                        Remover
                      </button>
                    </footer>
                  </section>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}