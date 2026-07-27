import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
    Heart,
  LoaderCircle,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import {
  useFavorites,
} from "../contexts/FavoritesContext";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

import {
  ApiError,
  apiRequest,
} from "../lib/api";

import type {
  StoreCartResponse,
} from "../types/cart";

import type {
  PublicProductResponse,
  StoreProduct,
  StoreProductVariant,
} from "../types/store";

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

function calculateAvailableStock(
  variant:
    StoreProductVariant,
) {
  return Math.max(
    variant.stock -
      variant.reservedStock,
    0,
  );
}

function uniqueValues(
  values:
    Array<string | null>,
) {
  return Array.from(
    new Set(
      values.filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      ),
    ),
  );
}

export function StoreProductPage() {
  const {
    slug,
  } = useParams<{
    slug: string;
  }>();

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


  const [
    product,
    setProduct,
  ] =
    useState<StoreProduct | null>(
      null,
    );

  const [
    loadingProduct,
    setLoadingProduct,
  ] = useState(true);

  const [
    productError,
    setProductError,
  ] = useState("");

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] = useState(0);

  const [
    selectedColor,
    setSelectedColor,
  ] =
    useState<string | null>(
      null,
    );

  const [
    selectedSize,
    setSelectedSize,
  ] =
    useState<string | null>(
      null,
    );

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    addingToCart,
    setAddingToCart,
  ] = useState(false);

  const [
    cartError,
    setCartError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadProduct =
    useCallback(async () => {
      if (!slug) {
        setProductError(
          "Produto não informado.",
        );

        setLoadingProduct(
          false,
        );

        return;
      }

      setLoadingProduct(true);
      setProductError("");

      try {
        const response =
          await apiRequest<
            PublicProductResponse
          >(
            `/products/${encodeURIComponent(
              slug,
            )}`,
          );

        const loadedProduct =
          response.data.product;

        setProduct(
          loadedProduct,
        );

        const defaultVariant =
          loadedProduct.variants.find(
            (variant) =>
              calculateAvailableStock(
                variant,
              ) > 0,
          ) ??
          loadedProduct
            .variants[0] ??
          null;

        setSelectedColor(
          defaultVariant?.color ??
            null,
        );

        setSelectedSize(
          defaultVariant?.size ??
            null,
        );

        const primaryImageIndex =
          loadedProduct.images.findIndex(
            (image) =>
              image.isPrimary,
          );

        setActiveImageIndex(
          primaryImageIndex >= 0
            ? primaryImageIndex
            : 0,
        );

        setQuantity(1);
      } catch (caughtError) {
        setProduct(null);

        setProductError(
          caughtError instanceof
            ApiError
            ? caughtError.message
            : "Não foi possível carregar o produto.",
        );
      } finally {
        setLoadingProduct(false);
      }
    }, [slug]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadProduct();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadProduct]);

  const activeVariants =
    useMemo(
      () =>
        product?.variants.filter(
          (variant) =>
            variant.isActive,
        ) ?? [],
      [product],
    );

  const hasColors =
    useMemo(
      () =>
        activeVariants.some(
          (variant) =>
            Boolean(
              variant.color,
            ),
        ),
      [activeVariants],
    );

  const hasSizes =
    useMemo(
      () =>
        activeVariants.some(
          (variant) =>
            Boolean(
              variant.size,
            ),
        ),
      [activeVariants],
    );

  const colorOptions =
    useMemo(
      () =>
        uniqueValues(
          activeVariants
            .filter(
              (variant) =>
                !hasSizes ||
                selectedSize ===
                  null ||
                variant.size ===
                  selectedSize,
            )
            .map(
              (variant) =>
                variant.color,
            ),
        ),
      [
        activeVariants,
        hasSizes,
        selectedSize,
      ],
    );

  const sizeOptions =
    useMemo(
      () =>
        uniqueValues(
          activeVariants
            .filter(
              (variant) =>
                !hasColors ||
                selectedColor ===
                  null ||
                variant.color ===
                  selectedColor,
            )
            .map(
              (variant) =>
                variant.size,
            ),
        ),
      [
        activeVariants,
        hasColors,
        selectedColor,
      ],
    );

  const selectedVariant =
    useMemo(
      () =>
        activeVariants.find(
          (variant) =>
            (!hasColors ||
              variant.color ===
                selectedColor) &&
            (!hasSizes ||
              variant.size ===
                selectedSize),
        ) ?? null,
      [
        activeVariants,
        hasColors,
        hasSizes,
        selectedColor,
        selectedSize,
      ],
    );

  const availableStock =
    selectedVariant
      ? calculateAvailableStock(
          selectedVariant,
        )
      : 0;

  const hasDiscount =
    selectedVariant
      ?.compareAtPriceInCents !==
      null &&
    selectedVariant
      ?.compareAtPriceInCents !==
      undefined &&
    selectedVariant
      .compareAtPriceInCents >
      selectedVariant
        .priceInCents;

  const discountPercentage =
    hasDiscount &&
    selectedVariant
      ?.compareAtPriceInCents
      ? Math.round(
          (1 -
            selectedVariant
              .priceInCents /
              selectedVariant
                .compareAtPriceInCents) *
            100,
        )
      : 0;

  const activeImage =
    product?.images[
      activeImageIndex
    ] ?? null;
const productIsFavorite =
  product
    ? isFavorite(
        product.publicId,
      )
    : false;

const togglingFavorite =
  product
    ? isToggling(
        product.publicId,
      )
    : false;
  function selectColor(
    color: string,
  ) {
    const matchingVariants =
      activeVariants.filter(
        (variant) =>
          variant.color ===
          color,
      );

    const currentCombination =
      matchingVariants.find(
        (variant) =>
          !hasSizes ||
          variant.size ===
            selectedSize,
      );

    const fallbackVariant =
      matchingVariants.find(
        (variant) =>
          calculateAvailableStock(
            variant,
          ) > 0,
      ) ??
      matchingVariants[0] ??
      null;

    setSelectedColor(color);

    if (
      hasSizes &&
      !currentCombination
    ) {
      setSelectedSize(
        fallbackVariant?.size ??
          null,
      );
    }

    setQuantity(1);
    setCartError("");
    setSuccessMessage("");
  }

  function selectSize(
    size: string,
  ) {
    const matchingVariants =
      activeVariants.filter(
        (variant) =>
          variant.size === size,
      );

    const currentCombination =
      matchingVariants.find(
        (variant) =>
          !hasColors ||
          variant.color ===
            selectedColor,
      );

    const fallbackVariant =
      matchingVariants.find(
        (variant) =>
          calculateAvailableStock(
            variant,
          ) > 0,
      ) ??
      matchingVariants[0] ??
      null;

    setSelectedSize(size);

    if (
      hasColors &&
      !currentCombination
    ) {
      setSelectedColor(
        fallbackVariant?.color ??
          null,
      );
    }

    setQuantity(1);
    setCartError("");
    setSuccessMessage("");
  }

  function colorHasStock(
    color: string,
  ) {
    return activeVariants.some(
      (variant) =>
        variant.color === color &&
        (!hasSizes ||
          selectedSize ===
            null ||
          variant.size ===
            selectedSize) &&
        calculateAvailableStock(
          variant,
        ) > 0,
    );
  }

  function sizeHasStock(
    size: string,
  ) {
    return activeVariants.some(
      (variant) =>
        variant.size === size &&
        (!hasColors ||
          selectedColor ===
            null ||
          variant.color ===
            selectedColor) &&
        calculateAvailableStock(
          variant,
        ) > 0,
    );
  }

  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    );
  }

  function increaseQuantity() {
    setQuantity(
      (current) =>
        Math.min(
          availableStock,
          current + 1,
        ),
    );
  }

  function previousImage() {
    if (
      !product ||
      product.images.length <= 1
    ) {
      return;
    }

    setActiveImageIndex(
      (current) =>
        current === 0
          ? product.images
              .length - 1
          : current - 1,
    );
  }

  function nextImage() {
    if (
      !product ||
      product.images.length <= 1
    ) {
      return;
    }

    setActiveImageIndex(
      (current) =>
        current ===
        product.images
          .length - 1
          ? 0
          : current + 1,
    );
  }

  async function handleFavorite() {
  if (!product) {
    return;
  }

  setCartError("");
  setSuccessMessage("");

  if (
    !loadingAuth &&
    !authenticated
  ) {
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
    setCartError(
      "Entre com uma conta de cliente para usar os favoritos.",
    );

    return;
  }

  try {
    const added =
      await toggleFavorite(
        product.publicId,
      );

    setSuccessMessage(
      added
        ? "Produto adicionado aos favoritos."
        : "Produto removido dos favoritos.",
    );
  } catch (caughtError) {
    setCartError(
      caughtError instanceof
        ApiError
        ? caughtError.message
        : "Não foi possível alterar os favoritos.",
    );
  }
}

  async function addToCart() {
    setCartError("");
    setSuccessMessage("");

    if (!selectedVariant) {
      setCartError(
        "Selecione uma variação do produto.",
      );

      return;
    }

    if (
      availableStock <= 0
    ) {
      setCartError(
        "Esta variação está sem estoque.",
      );

      return;
    }

    if (
      !loadingAuth &&
      !authenticated
    ) {
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
      setCartError(
        "Entre com uma conta de cliente para adicionar produtos ao carrinho.",
      );

      return;
    }

    setAddingToCart(true);

    try {
      const response =
        await apiRequest<
          StoreCartResponse
        >(
          "/cart/items",
          {
            method: "POST",

            body: JSON.stringify({
              variantId:
                selectedVariant.publicId,

              quantity,
            }),
          },
        );

      setSuccessMessage(
        `${quantity} ${
          quantity === 1
            ? "unidade adicionada"
            : "unidades adicionadas"
        } ao carrinho.`,
      );

      window.dispatchEvent(
        new CustomEvent(
          "ls-street-cart-updated",
          {
            detail:
              response.data,
          },
        ),
      );
    } catch (caughtError) {
      setCartError(
        caughtError instanceof
          ApiError
          ? caughtError.message
          : "Não foi possível adicionar o produto ao carrinho.",
      );
    } finally {
      setAddingToCart(false);
    }
  }

  if (loadingProduct) {
    return (
      <div className="store-product-page-state">
        <LoaderCircle
          size={30}
          className="icon-spinning"
        />

        <span>
          Carregando produto...
        </span>
      </div>
    );
  }

  if (
    productError ||
    !product
  ) {
    return (
      <div className="store-product-page-state">
        <PackageX size={42} />

        <h1>
          Produto não encontrado
        </h1>

        <p>
          {productError ||
            "Este produto não está disponível."}
        </p>

        <Link to="/">
          <ArrowLeft size={18} />
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="store-product-page">
      <nav className="store-product-breadcrumb">
        <Link to="/">
          Início
        </Link>

        <span>/</span>

        <Link
          to={`/?category=${product.category.slug}#destaques`}
        >
          {product.category.name}
        </Link>

        <span>/</span>

        <strong>
          {product.name}
        </strong>

        <button
  type="button"
  className={
    productIsFavorite
      ? "store-product-detail-favorite active"
      : "store-product-detail-favorite"
  }
  disabled={
    loadingAuth ||
    togglingFavorite
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

  {productIsFavorite
    ? "Remover dos favoritos"
    : "Adicionar aos favoritos"}
</button>
      </nav>

      <section className="store-product-detail">
        <div className="store-product-gallery">
          <div className="store-product-thumbnails">
            {product.images.map(
              (image, index) => (
                <button
                  type="button"
                  key={
                    image.publicId
                  }
                  className={
                    index ===
                    activeImageIndex
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveImageIndex(
                      index,
                    )
                  }
                >
                  <img
                    src={image.url}
                    alt={
                      image.altText ??
                      product.name
                    }
                  />
                </button>
              ),
            )}
          </div>

          <div className="store-product-main-image">
            {activeImage ? (
              <img
                src={
                  activeImage.url
                }
                alt={
                  activeImage.altText ??
                  product.name
                }
              />
            ) : (
              <div className="store-product-no-image">
                <ImageIcon
                  size={48}
                />

                <span>
                  Produto sem imagem
                </span>
              </div>
            )}

            {product.isFeatured && (
              <span className="store-product-detail-featured">
                <Sparkles
                  size={15}
                />

                Produto em destaque
              </span>
            )}

            {hasDiscount && (
              <span className="store-product-detail-discount">
                -{discountPercentage}%
              </span>
            )}

            {product.images.length >
              1 && (
              <div className="store-product-gallery-navigation">
                <button
                  type="button"
                  onClick={
                    previousImage
                  }
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft
                    size={22}
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    nextImage
                  }
                  aria-label="Próxima imagem"
                >
                  <ChevronRight
                    size={22}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="store-product-purchase">
          <Link
            to="/"
            className="store-product-back"
          >
            <ArrowLeft size={17} />
            Voltar para produtos
          </Link>

          <span className="store-product-detail-category">
            {product.category.name}
          </span>

          <h1>
            {product.name}
          </h1>

          {product.brand && (
            <span className="store-product-detail-brand">
              Marca:{" "}
              <strong>
                {product.brand}
              </strong>
            </span>
          )}

          <p className="store-product-short-description">
            {product.shortDescription ??
              product.description ??
              "Streetwear autêntico LS STREET."}
          </p>

          <div className="store-product-detail-price">
            {hasDiscount &&
              selectedVariant && (
                <small>
                  {formatMoney(
                    selectedVariant
                      .compareAtPriceInCents!,
                  )}
                </small>
              )}

            <strong>
              {selectedVariant
                ? formatMoney(
                    selectedVariant
                      .priceInCents,
                  )
                : "Selecione uma variação"}
            </strong>

            {hasDiscount && (
              <span>
                Economia de{" "}
                {formatMoney(
                  selectedVariant!
                    .compareAtPriceInCents! -
                    selectedVariant!
                      .priceInCents,
                )}
              </span>
            )}
          </div>

          {hasColors && (
            <section className="store-product-option-section">
              <header>
                <span>
                  Cor
                </span>

                <strong>
                  {selectedColor ??
                    "Selecione"}
                </strong>
              </header>

              <div className="store-product-color-options">
                {colorOptions.map(
                  (color) => {
                    const inStock =
                      colorHasStock(
                        color,
                      );

                    return (
                      <button
                        type="button"
                        key={color}
                        className={
                          selectedColor ===
                          color
                            ? "active"
                            : ""
                        }
                        disabled={
                          !inStock
                        }
                        onClick={() =>
                          selectColor(
                            color,
                          )
                        }
                      >
                        {color}

                        {!inStock && (
                          <small>
                            Esgotado
                          </small>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </section>
          )}

          {hasSizes && (
            <section className="store-product-option-section">
              <header>
                <span>
                  Tamanho
                </span>

                <strong>
                  {selectedSize ??
                    "Selecione"}
                </strong>
              </header>

              <div className="store-product-size-options">
                {sizeOptions.map(
                  (size) => {
                    const inStock =
                      sizeHasStock(
                        size,
                      );

                    return (
                      <button
                        type="button"
                        key={size}
                        className={
                          selectedSize ===
                          size
                            ? "active"
                            : ""
                        }
                        disabled={
                          !inStock
                        }
                        onClick={() =>
                          selectSize(
                            size,
                          )
                        }
                      >
                        {size}
                      </button>
                    );
                  },
                )}
              </div>
            </section>
          )}

          <section className="store-product-selected-variant">
            <div>
              <span>
                Variação selecionada
              </span>

              <strong>
                {selectedVariant
                  ? [
                      selectedVariant.color,
                      selectedVariant.size,
                    ]
                      .filter(Boolean)
                      .join(" · ") ||
                    selectedVariant.sku
                  : "Nenhuma"}
              </strong>
            </div>

            <div>
              <span>
                Disponibilidade
              </span>

              <strong
                className={
                  availableStock > 0
                    ? "available"
                    : "unavailable"
                }
              >
                {availableStock > 0
                  ? `${availableStock} em estoque`
                  : "Esgotado"}
              </strong>
            </div>
          </section>

          <section className="store-product-quantity-section">
            <span>
              Quantidade
            </span>

            <div className="store-product-quantity-control">
              <button
                type="button"
                onClick={
                  decreaseQuantity
                }
                disabled={
                  quantity <= 1
                }
              >
                <Minus size={18} />
              </button>

              <strong>
                {quantity}
              </strong>

              <button
                type="button"
                onClick={
                  increaseQuantity
                }
                disabled={
                  availableStock <= 0 ||
                  quantity >=
                    availableStock
                }
              >
                <Plus size={18} />
              </button>
            </div>
          </section>

          {cartError && (
            <div className="store-product-cart-error">
              <X size={17} />

              <span>
                {cartError}
              </span>
            </div>
          )}

          {successMessage && (
            <div className="store-product-cart-success">
              <PackageCheck
                size={18}
              />

              <span>
                {successMessage}
              </span>
            </div>
          )}

          <button
            type="button"
            className="store-product-add-cart"
            disabled={
              addingToCart ||
              loadingAuth ||
              !selectedVariant ||
              availableStock <= 0
            }
            onClick={() => {
              void addToCart();
            }}
          >
            {addingToCart ? (
              <>
                <LoaderCircle
                  size={20}
                  className="icon-spinning"
                />

                Adicionando...
              </>
            ) : availableStock <=
              0 ? (
              <>
                <PackageX
                  size={20}
                />

                Produto esgotado
              </>
            ) : (
              <>
                <ShoppingBag
                  size={20}
                />

                Adicionar ao carrinho
              </>
            )}
          </button>

          <div className="store-product-benefit-list">
            <article>
              <Truck size={20} />

              <div>
                <strong>
                  Entrega nacional
                </strong>

                <span>
                  Envio para todo o
                  Brasil
                </span>
              </div>
            </article>

            <article>
              <ShieldCheck
                size={20}
              />

              <div>
                <strong>
                  Compra segura
                </strong>

                <span>
                  Pagamento protegido
                </span>
              </div>
            </article>

            <article>
              <RotateCcw
                size={20}
              />

              <div>
                <strong>
                  Troca facilitada
                </strong>

                <span>
                  Atendimento LS
                  STREET
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="store-product-description-section">
        <header>
          <span>
            SOBRE O PRODUTO
          </span>

          <h2>
            Detalhes
          </h2>
        </header>

        <div>
          <p>
            {product.description ??
              product.shortDescription ??
              "Produto desenvolvido para representar a identidade urbana da LS STREET."}
          </p>

          <dl>
            <div>
              <dt>
                Categoria
              </dt>

              <dd>
                {product.category.name}
              </dd>
            </div>

            <div>
              <dt>
                Marca
              </dt>

              <dd>
                {product.brand ??
                  "LS STREET"}
              </dd>
            </div>

            <div>
              <dt>
                SKU
              </dt>

              <dd>
                {selectedVariant?.sku ??
                  "Selecione uma variação"}
              </dd>
            </div>

            <div>
              <dt>
                Variações
              </dt>

              <dd>
                {
                  activeVariants.length
                }
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}