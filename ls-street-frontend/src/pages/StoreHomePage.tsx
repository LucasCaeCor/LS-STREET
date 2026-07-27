import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ImageIcon,
  LoaderCircle,
  Search,
  Shirt,
  Sparkles,
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
  useSearchParams,
} from "react-router";

import {
  StoreProductCard,
} from "../components/StoreProductCard";

import {
  apiRequest,
} from "../lib/api";

import type {
  PublicBannersResponse,
  PublicCategoriesResponse,
  PublicProductsResponse,
  StoreBanner,
  StoreCategory,
  StoreProduct,
} from "../types/store";

export function StoreHomePage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [
    banners,
    setBanners,
  ] = useState<
    StoreBanner[]
  >([]);

  const [
    categories,
    setCategories,
  ] = useState<
    StoreCategory[]
  >([]);

  const [
    products,
    setProducts,
  ] = useState<
    StoreProduct[]
  >([]);

  const [
    activeBannerIndex,
    setActiveBannerIndex,
  ] = useState(0);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("");

  const searchFromUrl =
    searchParams.get("search") ??
    "";

  const [
    searchDraft,
    setSearchDraft,
  ] = useState(
    searchFromUrl,
  );

  const [
    loadingPage,
    setLoadingPage,
  ] = useState(true);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadInitialContent =
    useCallback(async () => {
      setLoadingPage(true);
      setError("");

      try {
        const [
          bannerResponse,
          categoryResponse,
        ] = await Promise.all([
          apiRequest<
            PublicBannersResponse
          >(
            "/banners?position=HOME_HERO",
          ),

          apiRequest<
            PublicCategoriesResponse
          >(
            "/categories?page=1&limit=12&sortOrder=asc",
          ),
        ]);

        setBanners(
          bannerResponse.data
            .banners,
        );

        setCategories(
          categoryResponse.data,
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar a loja.",
        );
      } finally {
        setLoadingPage(false);
      }
    }, []);

  const loadProducts =
    useCallback(async () => {
      setLoadingProducts(true);
      setError("");

      const query =
        new URLSearchParams();

      query.set("page", "1");
      query.set("limit", "12");

      query.set(
        "sortBy",
        "createdAt",
      );

      query.set(
        "sortOrder",
        "desc",
      );

      if (searchFromUrl) {
        query.set(
          "search",
          searchFromUrl,
        );
      }

      if (selectedCategory) {
        query.set(
          "categorySlug",
          selectedCategory,
        );
      }

      if (
        !searchFromUrl &&
        !selectedCategory
      ) {
        query.set(
          "isFeatured",
          "true",
        );
      }

      try {
        let response =
          await apiRequest<
            PublicProductsResponse
          >(
            `/products?${query.toString()}`,
          );

        if (
          response.data.length === 0 &&
          !searchFromUrl &&
          !selectedCategory
        ) {
          const fallbackQuery =
            new URLSearchParams();

          fallbackQuery.set(
            "page",
            "1",
          );

          fallbackQuery.set(
            "limit",
            "12",
          );

          fallbackQuery.set(
            "sortBy",
            "createdAt",
          );

          fallbackQuery.set(
            "sortOrder",
            "desc",
          );

          response =
            await apiRequest<
              PublicProductsResponse
            >(
              `/products?${fallbackQuery.toString()}`,
            );
        }

        setProducts(
          response.data,
        );
      } catch (caughtError) {
        setProducts([]);

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar os produtos.",
        );
      } finally {
        setLoadingProducts(false);
      }
    }, [
      searchFromUrl,
      selectedCategory,
    ]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadInitialContent();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadInitialContent]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadProducts();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadProducts]);

  useEffect(() => {
  const timeoutId =
    window.setTimeout(() => {
      setSearchDraft(
        searchFromUrl,
      );
    }, 0);

  return () => {
    window.clearTimeout(
      timeoutId,
    );
  };
}, [searchFromUrl]);

  useEffect(() => {
  if (
    activeBannerIndex <
    banners.length
  ) {
    return;
  }

  const timeoutId =
    window.setTimeout(() => {
      setActiveBannerIndex(0);
    }, 0);

  return () => {
    window.clearTimeout(
      timeoutId,
    );
  };
}, [
  activeBannerIndex,
  banners.length,
]);

  const activeBanner =
    banners[
      activeBannerIndex
    ] ?? null;

  const selectedCategoryName =
    useMemo(
      () =>
        categories.find(
          (category) =>
            category.slug ===
            selectedCategory,
        )?.name ?? "",
      [
        categories,
        selectedCategory,
      ],
    );

  function previousBanner() {
    if (
      banners.length <= 1
    ) {
      return;
    }

    setActiveBannerIndex(
      (current) =>
        current === 0
          ? banners.length - 1
          : current - 1,
    );
  }

  function nextBanner() {
    if (
      banners.length <= 1
    ) {
      return;
    }

    setActiveBannerIndex(
      (current) =>
        current ===
        banners.length - 1
          ? 0
          : current + 1,
    );
  }

  function handleSearch(
    event: FormEvent,
  ) {
    event.preventDefault();

    const normalizedSearch =
      searchDraft.trim();

    setSelectedCategory("");

    if (normalizedSearch) {
      setSearchParams({
        search:
          normalizedSearch,
      });
    } else {
      setSearchParams({});
    }

    window.location.hash =
      "destaques";
  }

  function clearProductFilters() {
    setSearchDraft("");
    setSelectedCategory("");
    setSearchParams({});
  }

  if (loadingPage) {
    return (
      <div className="store-page-loading">
        <LoaderCircle
          size={29}
          className="icon-spinning"
        />

        <span>
          Preparando a loja...
        </span>
      </div>
    );
  }

  return (
    <div className="store-home">
      {error && (
        <div className="store-error">
          {error}
        </div>
      )}

      <section
        className="store-hero"
        id="inicio"
      >
        {activeBanner ? (
          <>
            <picture>
              {activeBanner.mobileImageUrl && (
                <source
                  media="(max-width: 700px)"
                  srcSet={
                    activeBanner.mobileImageUrl
                  }
                />
              )}

              <img
                src={
                  activeBanner.imageUrl
                }
                alt={
                  activeBanner.title
                }
              />
            </picture>

            <div className="store-hero-overlay" />

            <div className="store-hero-content">
              <span className="store-hero-eyebrow">
                NOVA COLEÇÃO
              </span>

              <h1>
                {activeBanner.title}
              </h1>

              {activeBanner.subtitle && (
                <p>
                  {
                    activeBanner.subtitle
                  }
                </p>
              )}

              {activeBanner.link && (
                <a
                  href={
                    activeBanner.link
                  }
                  className="store-hero-button"
                >
                  {activeBanner.buttonText ??
                    "Explorar agora"}

                  <ArrowRight
                    size={19}
                  />
                </a>
              )}
            </div>

            {banners.length > 1 && (
              <>
                <div className="store-hero-navigation">
                  <button
                    type="button"
                    onClick={
                      previousBanner
                    }
                    aria-label="Banner anterior"
                  >
                    <ArrowLeft
                      size={20}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      nextBanner
                    }
                    aria-label="Próximo banner"
                  >
                    <ArrowRight
                      size={20}
                    />
                  </button>
                </div>

                <div className="store-hero-indicators">
                  {banners.map(
                    (
                      banner,
                      index,
                    ) => (
                      <button
                        type="button"
                        key={
                          banner.id
                        }
                        className={
                          index ===
                          activeBannerIndex
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setActiveBannerIndex(
                            index,
                          )
                        }
                        aria-label={`Abrir banner ${
                          index + 1
                        }`}
                      />
                    ),
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="store-hero-fallback">
            <div>
              <span>
                LS STREET
              </span>

              <h1>
                A rua é o seu
                palco.
              </h1>

              <p>
                Estilo urbano,
                atitude e peças
                criadas para marcar
                presença.
              </p>

              <a href="#destaques">
                Conhecer produtos

                <ArrowRight
                  size={19}
                />
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="store-benefits">
        <article>
          <Truck size={24} />

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
          <Sparkles
            size={24}
          />

          <div>
            <strong>
              Peças selecionadas
            </strong>

            <span>
              Qualidade e estilo
              LS
            </span>
          </div>
        </article>

        <article>
          <Shirt size={24} />

          <div>
            <strong>
              Streetwear autêntico
            </strong>

            <span>
              Vista sua identidade
            </span>
          </div>
        </article>
      </section>

      <section
        className="store-section store-categories-section"
        id="categorias"
      >
        <header className="store-section-header">
          <div>
            <span>
              EXPLORE
            </span>

            <h2>
              Compre por categoria
            </h2>

            <p>
              Encontre o estilo que
              combina com você.
            </p>
          </div>
        </header>

        {categories.length === 0 ? (
          <div className="store-empty-state">
            <ImageIcon
              size={34}
            />

            <strong>
              Nenhuma categoria
              disponível.
            </strong>
          </div>
        ) : (
          <div className="store-category-grid">
            {categories.map(
              (category) => (
                <button
                  type="button"
                  key={category.id}
                  className={
                    selectedCategory ===
                    category.slug
                      ? "store-category-card active"
                      : "store-category-card"
                  }
                  onClick={() => {
                    setSearchDraft("");

                    setSearchParams({});

                    setSelectedCategory(
                      (current) =>
                        current ===
                        category.slug
                          ? ""
                          : category.slug,
                    );

                    window.location.hash =
                      "destaques";
                  }}
                >
                  <div className="store-category-image">
                    {category.imageUrl ? (
                      <img
                        src={
                          category.imageUrl
                        }
                        alt={
                          category.name
                        }
                      />
                    ) : (
                      <Shirt
                        size={34}
                      />
                    )}

                    <div />
                  </div>

                  <section>
                    <span>
                      CATEGORIA
                    </span>

                    <strong>
                      {category.name}
                    </strong>

                    <small>
                      {category.description ??
                        "Descobrir coleção"}
                    </small>
                  </section>

                  <ChevronRight
                    size={20}
                  />
                </button>
              ),
            )}
          </div>
        )}
      </section>

      <section
        className="store-section store-products-section"
        id="destaques"
      >
        <header className="store-section-header store-products-header">
          <div>
            <span>
              {searchFromUrl ||
              selectedCategory
                ? "RESULTADOS"
                : "DESTAQUES"}
            </span>

            <h2>
              {searchFromUrl
                ? `Busca por “${searchFromUrl}”`
                : selectedCategoryName
                  ? selectedCategoryName
                  : "Produtos em destaque"}
            </h2>

            <p>
              {searchFromUrl ||
              selectedCategory
                ? "Produtos encontrados para o filtro selecionado."
                : "Seleções que representam a essência da LS STREET."}
            </p>
          </div>

          {(searchFromUrl ||
            selectedCategory) && (
            <button
              type="button"
              className="store-clear-filters"
              onClick={
                clearProductFilters
              }
            >
              <X size={17} />
              Limpar filtro
            </button>
          )}
        </header>

        <form
          className="store-product-search"
          onSubmit={handleSearch}
        >
          <Search size={20} />

          <input
            value={searchDraft}
            onChange={(event) =>
              setSearchDraft(
                event.target.value,
              )
            }
            placeholder="O que você está procurando?"
          />

          <button type="submit">
            Buscar
          </button>
        </form>

        {loadingProducts ? (
          <div className="store-products-loading">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <div className="store-empty-state">
            <Search size={35} />

            <strong>
              Nenhum produto
              encontrado.
            </strong>

            <span>
              Experimente alterar a
              busca ou a categoria.
            </span>

            <button
              type="button"
              onClick={
                clearProductFilters
              }
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="store-product-grid">
            {products.map(
              (product) => (
                <StoreProductCard
                  key={
                    product.publicId ??
                    product.id
                  }
                  product={product}
                />
              ),
            )}
          </div>
        )}
      </section>

      <section className="store-brand-section">
        <div>
          <span>
            LS STREET
          </span>

          <h2>
            Não seguimos a rua.
            Fazemos parte dela.
          </h2>

          <p>
            A LS STREET nasceu para
            representar quem usa a
            moda como forma de
            expressão. Sem padrões.
            Sem cópias. Só identidade.
          </p>

          <a href="#destaques">
            Explorar coleção

            <ArrowRight
              size={19}
            />
          </a>
        </div>
      </section>
    </div>
  );
}