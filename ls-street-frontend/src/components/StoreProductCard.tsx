import {
  ImageIcon,
  PackageX,
  Sparkles,
} from "lucide-react";

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

  return (
    <article className="store-product-card">
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
            <Sparkles size={14} />
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
    </article>
  );
}