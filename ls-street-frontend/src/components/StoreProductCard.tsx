import {
  Heart,
  ImageIcon,
  LoaderCircle,
  PackageX,
  Sparkles,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

import {
  useFavorites,
} from "../contexts/FavoritesContext";

import type {
  StoreProduct,
} from "../types/store";

interface StoreProductCardProps {
  product: StoreProduct;
}

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

export function StoreProductCard({
  product,
}: StoreProductCardProps) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    loading: loadingAuth,
    authenticated,
  } = useAuth();

  const {
    isFavorite,
    isToggling,
    toggleFavorite,
  } = useFavorites();

  const productIsFavorite =
    isFavorite(
      product.publicId,
    );

  const togglingFavorite =
    isToggling(
      product.publicId,
    );

  const primaryImage =
    product.images.find(
      (image) =>
        image.isPrimary,
    ) ??
    product.images[0] ??
    null;

  const availableVariants =
    product.variants.filter(
      (variant) =>
        variant.isActive,
    );

  const cheapestVariant =
    availableVariants[0] ??
    null;

  const availableStock =
    availableVariants.reduce(
      (
        total,
        variant,
      ) =>
        total +
        Math.max(
          variant.stock -
            variant.reservedStock,
          0,
        ),
      0,
    );

  const hasDiscount =
    cheapestVariant
      ?.compareAtPriceInCents !==
      null &&
    cheapestVariant
      ?.compareAtPriceInCents !==
      undefined &&
    cheapestVariant
      .compareAtPriceInCents >
      cheapestVariant
        .priceInCents;

  async function handleFavorite() {
    if (loadingAuth) {
      return;
    }

    if (!authenticated) {
      const redirect =
        encodeURIComponent(
          `${location.pathname}${location.search}`,
        );

      navigate(
        `/conta/entrar?redirect=${redirect}`,
      );

      return;
    }

    if (
      user?.role !==
      "CUSTOMER"
    ) {
      navigate("/admin");

      return;
    }

    try {
      await toggleFavorite(
        product.publicId,
      );
    } catch {
      return;
    }
  }

  return (
    <article className="store-product-card">
      <button
        type="button"
        className={
          productIsFavorite
            ? "store-product-favorite-button active"
            : "store-product-favorite-button"
        }
        disabled={
          loadingAuth ||
          togglingFavorite
        }
        aria-label={
          productIsFavorite
            ? `Remover ${product.name} dos favoritos`
            : `Adicionar ${product.name} aos favoritos`
        }
        aria-pressed={
          productIsFavorite
        }
        onClick={() => {
          void handleFavorite();
        }}
      >
        {togglingFavorite ? (
          <LoaderCircle
            size={18}
            className="icon-spinning"
          />
        ) : (
          <Heart
            size={18}
            fill={
              productIsFavorite
                ? "currentColor"
                : "none"
            }
          />
        )}
      </button>

      <Link
        to={`/produto/${product.slug}`}
        className="store-product-card-link"
        aria-label={`Ver ${product.name}`}
      >
        <div className="store-product-image">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={
                primaryImage.altText ??
                product.name
              }
            />
          ) : (
            <div className="store-product-image-empty">
              <ImageIcon
                size={34}
              />

              <span>
                Sem imagem
              </span>
            </div>
          )}

          {product.isFeatured && (
            <span className="store-product-featured">
              <Sparkles
                size={14}
              />
              Destaque
            </span>
          )}

          {hasDiscount && (
            <span className="store-product-discount">
              OFERTA
            </span>
          )}
        </div>

        <div className="store-product-content">
          <span className="store-product-category">
            {product.category.name}
          </span>

          <h3>{product.name}</h3>

          <p>
            {product.shortDescription ??
              product.description ??
              "Streetwear autêntico LS STREET."}
          </p>

          <div className="store-product-meta">
            {product.brand && (
              <span>
                {product.brand}
              </span>
            )}

            <span>
              {
                availableVariants.length
              }{" "}
              {availableVariants.length ===
              1
                ? "variação"
                : "variações"}
            </span>
          </div>

          <footer className="store-product-footer">
            <div>
              {hasDiscount &&
                cheapestVariant && (
                  <small>
                    {formatMoney(
                      cheapestVariant
                        .compareAtPriceInCents!,
                    )}
                  </small>
                )}

              <strong>
                {cheapestVariant
                  ? formatMoney(
                      cheapestVariant
                        .priceInCents,
                    )
                  : "Indisponível"}
              </strong>

              {cheapestVariant && (
                <span>
                  ou em pagamentos
                  selecionados
                </span>
              )}
            </div>

            <span
              className={
                availableStock > 0
                  ? "store-product-stock"
                  : "store-product-stock unavailable"
              }
            >
              {availableStock > 0 ? (
                <>
                  {availableStock} em
                  estoque
                </>
              ) : (
                <>
                  <PackageX
                    size={15}
                  />
                  Esgotado
                </>
              )}
            </span>
          </footer>
        </div>
      </Link>
    </article>
  );
}