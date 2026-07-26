import {
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Edit3,
  ImageIcon,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  ProductVariantsModal,
} from "../components/ProductVariantsModal";



import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  apiRequest,
  ApiError,
} from "../lib/api";

import type {
  CategoriesResponse,
  Category,
  CategoryPagination,
} from "../types/categories";

import type {
  Product,
  ProductResponse,
  ProductsResponse,
  ProductStatus,
} from "../types/products";

interface ProductFilters {
  search: string;
  categorySlug: string;
  status: ProductStatus | "";

  sortBy:
    | "name"
    | "createdAt"
    | "updatedAt";

  sortOrder:
    | "asc"
    | "desc";
}

interface ProductForm {
  name: string;
  categoryId: string;

  brand: string;

  shortDescription: string;
  description: string;

  seoTitle: string;
  seoDescription: string;
}

const initialFilters: ProductFilters = {
  search: "",
  categorySlug: "",
  status: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};




const initialForm: ProductForm = {
  name: "",
  categoryId: "",
  brand: "",
  shortDescription: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
};

const emptyPagination: CategoryPagination = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const productStatuses: ProductStatus[] = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];

function formatMoney(
  valueInCents: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(valueInCents / 100);
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function formatStatus(
  status: ProductStatus,
) {
  const labels: Record<
    ProductStatus,
    string
  > = {
    DRAFT: "Rascunho",
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    ARCHIVED: "Arquivado",
  };

  return labels[status];
}

function getPrimaryImage(
  product: Product,
) {
  return (
    product.images.find(
      (image) =>
        image.isPrimary,
    ) ??
    product.images[0] ??
    null
  );
}

function getMinimumPrice(
  product: Product,
) {
  const activeVariants =
    product.variants.filter(
      (variant) =>
        variant.isActive,
    );

  if (
    activeVariants.length === 0
  ) {
    return null;
  }

  return Math.min(
    ...activeVariants.map(
      (variant) =>
        variant.priceInCents,
    ),
  );
}

function getAvailableStock(
  product: Product,
) {
  return product.variants.reduce(
    (total, variant) =>
      total +
      Math.max(
        0,
        variant.stock -
          variant.reservedStock,
      ),
    0,
  );
}

export function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);


    const [
  variantsProduct,
  setVariantsProduct,
] =
  useState<Product | null>(
    null,
  );

  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<CategoryPagination>(
      emptyPagination,
    );

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<ProductFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<ProductFilters>(
      initialFilters,
    );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingProduct,
    setEditingProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [form, setForm] =
    useState<ProductForm>(
      initialForm,
    );

  const [saving, setSaving] =
    useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    changingStatusId,
    setChangingStatusId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    changingFeaturedId,
    setChangingFeaturedId,
  ] =
    useState<string | null>(
      null,
    );

  const loadCategories =
    useCallback(async () => {
      try {
        const response =
          await apiRequest<
            CategoriesResponse
          >(
            "/categories/admin?page=1&limit=100&sortOrder=asc",
          );

        setCategories(
          response.data,
        );
      } catch {
        setCategories([]);
      }
    }, []);

  const loadProducts =
    useCallback(async () => {
      setLoading(true);
      setError("");

      const query =
        new URLSearchParams();

      query.set(
        "page",
        String(page),
      );

      query.set(
        "limit",
        "20",
      );

      query.set(
        "sortBy",
        filters.sortBy,
      );

      query.set(
        "sortOrder",
        filters.sortOrder,
      );

      if (filters.search) {
        query.set(
          "search",
          filters.search,
        );
      }

      if (
        filters.categorySlug
      ) {
        query.set(
          "categorySlug",
          filters.categorySlug,
        );
      }

      if (filters.status) {
        query.set(
          "status",
          filters.status,
        );
      }

      try {
        const response =
          await apiRequest<
            ProductsResponse
          >(
            `/products/admin?${query.toString()}`,
          );

        setProducts(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setProducts([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível carregar os produtos.",
        );
      } finally {
        setLoading(false);
      }
    }, [filters, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  const activeCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.status ===
            "ACTIVE",
        ).length,
      [products],
    );

  const draftCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.status ===
            "DRAFT",
        ).length,
      [products],
    );

  function handleFilterSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setPage(1);

    setFilters({
      ...draftFilters,

      search:
        draftFilters.search.trim(),
    });
  }

  function clearFilters() {
    setDraftFilters(
      initialFilters,
    );

    setFilters(
      initialFilters,
    );

    setPage(1);
  }

  function openCreateModal() {
    const firstActiveCategory =
      categories.find(
        (category) =>
          category.isActive,
      );

    setEditingProduct(null);

    setForm({
      ...initialForm,

      categoryId:
        firstActiveCategory?.id ??
        "",
    });

    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    product: Product,
  ) {
    setEditingProduct(product);

    setForm({
      name: product.name,

      categoryId:
        product.category.publicId,

      brand:
        product.brand ?? "",

      shortDescription:
        product.shortDescription ??
        "",

      description:
        product.description ?? "",

      seoTitle:
        product.seoTitle ?? "",

      seoDescription:
        product.seoDescription ??
        "",
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
    setForm(initialForm);
    setFormError("");
  }

  async function handleSave(
    event: FormEvent,
  ) {
    event.preventDefault();

    const name =
      form.name.trim();

    if (name.length < 2) {
      setFormError(
        "Informe um nome válido.",
      );

      return;
    }

    if (!form.categoryId) {
      setFormError(
        "Selecione uma categoria.",
      );

      return;
    }

    setSaving(true);
    setFormError("");

    const optionalText = (
      value: string,
    ) => value.trim() || null;

    try {
      if (editingProduct) {
        await apiRequest<
          ProductResponse
        >(
          `/products/admin/${editingProduct.publicId}`,
          {
            method: "PUT",

            body: JSON.stringify({
              name,

              categoryId:
                form.categoryId,

              brand:
                optionalText(
                  form.brand,
                ),

              shortDescription:
                optionalText(
                  form.shortDescription,
                ),

              description:
                optionalText(
                  form.description,
                ),

              seoTitle:
                optionalText(
                  form.seoTitle,
                ),

              seoDescription:
                optionalText(
                  form.seoDescription,
                ),
            }),
          },
        );

        setSuccessMessage(
          "Produto atualizado com sucesso.",
        );
      } else {
        const body: {
          name: string;
          categoryId: string;
          status: "DRAFT";

          brand?: string;
          shortDescription?: string;
          description?: string;

          seoTitle?: string;
          seoDescription?: string;
        } = {
          name,

          categoryId:
            form.categoryId,

          status: "DRAFT",
        };

        if (form.brand.trim()) {
          body.brand =
            form.brand.trim();
        }

        if (
          form.shortDescription.trim()
        ) {
          body.shortDescription =
            form.shortDescription.trim();
        }

        if (
          form.description.trim()
        ) {
          body.description =
            form.description.trim();
        }

        if (form.seoTitle.trim()) {
          body.seoTitle =
            form.seoTitle.trim();
        }

        if (
          form.seoDescription.trim()
        ) {
          body.seoDescription =
            form.seoDescription.trim();
        }

        await apiRequest<
          ProductResponse
        >(
          "/products/admin",
          {
            method: "POST",

            body: JSON.stringify(
              body,
            ),
          },
        );

        setSuccessMessage(
          "Produto criado como rascunho.",
        );
      }

      setModalOpen(false);
      setEditingProduct(null);
      setForm(initialForm);

      await loadProducts();
    } catch (caughtError) {
      if (
        caughtError instanceof
        ApiError
      ) {
        setFormError(
          caughtError.message,
        );
      } else {
        setFormError(
          "Não foi possível salvar o produto.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    product: Product,
    status: ProductStatus,
  ) {
    if (
      product.status === status
    ) {
      return;
    }

    setChangingStatusId(
      product.publicId,
    );

    setError("");

    try {
      const response =
        await apiRequest<
          ProductResponse
        >(
          `/products/admin/${product.publicId}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              status,
            }),
          },
        );

      setProducts(
        (currentProducts) =>
          currentProducts.map(
            (currentProduct) =>
              currentProduct.publicId ===
              product.publicId
                ? response.data
                    .product
                : currentProduct,
          ),
      );

      setSuccessMessage(
        "Status atualizado com sucesso.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível atualizar o status.",
      );
    } finally {
      setChangingStatusId(null);
    }
  }

  async function toggleFeatured(
    product: Product,
  ) {
    setChangingFeaturedId(
      product.publicId,
    );

    setError("");

    try {
      const response =
        await apiRequest<
          ProductResponse
        >(
          `/products/admin/${product.publicId}/featured`,
          {
            method: "PATCH",

            body: JSON.stringify({
              isFeatured:
                !product.isFeatured,
            }),
          },
        );

      setProducts(
        (currentProducts) =>
          currentProducts.map(
            (currentProduct) =>
              currentProduct.publicId ===
              product.publicId
                ? response.data
                    .product
                : currentProduct,
          ),
      );

      setSuccessMessage(
        product.isFeatured
          ? "Produto removido dos destaques."
          : "Produto adicionado aos destaques.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível alterar o destaque.",
      );
    } finally {
      setChangingFeaturedId(
        null,
      );
    }
  }

  return (
    <div className="products-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            CATÁLOGO
          </span>

          <h1>Produtos</h1>

          <p>
            Gerencie os produtos
            disponíveis na LS Street.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void loadProducts();
            }}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "icon-spinning"
                  : ""
              }
            />

            Atualizar
          </button>

          <button
            type="button"
            className="compact-primary-button"
            onClick={
              openCreateModal
            }
          >
            <Plus size={18} />
            Novo produto
          </button>
        </div>
      </header>

      {successMessage && (
        <div className="category-success-message">
          <Check size={18} />

          <span>
            {successMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <section className="product-summary-grid">
        <article className="product-summary-card">
          <Package size={21} />

          <div>
            <span>
              Total encontrado
            </span>

            <strong>
              {
                pagination.totalItems
              }
            </strong>
          </div>
        </article>

        <article className="product-summary-card">
          <Check size={21} />

          <div>
            <span>
              Ativos nesta página
            </span>

            <strong>
              {activeCount}
            </strong>
          </div>
        </article>

        <article className="product-summary-card">
          <Edit3 size={21} />

          <div>
            <span>
              Rascunhos nesta página
            </span>

            <strong>
              {draftCount}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="products-filter-panel"
        onSubmit={
          handleFilterSubmit
        }
      >
        <div className="filter-field product-search-field">
          <label htmlFor="product-search">
            Buscar produto
          </label>

          <div className="filter-input">
            <Search size={17} />

            <input
              id="product-search"
              value={
                draftFilters.search
              }
              onChange={(event) =>
                setDraftFilters(
                  (current) => ({
                    ...current,

                    search:
                      event.target
                        .value,
                  }),
                )
              }
              placeholder="Nome, marca ou descrição"
            />
          </div>
        </div>

        <div className="filter-field">
          <label htmlFor="product-category">
            Categoria
          </label>

          <select
            id="product-category"
            value={
              draftFilters.categorySlug
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  categorySlug:
                    event.target
                      .value,
                }),
              )
            }
          >
            <option value="">
              Todas
            </option>

            {categories.map(
              (category) => (
                <option
                  value={
                    category.slug
                  }
                  key={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="product-status">
            Status
          </label>

          <select
            id="product-status"
            value={
              draftFilters.status
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  status:
                    event.target
                      .value as
                      | ProductStatus
                      | "",
                }),
              )
            }
          >
            <option value="">
              Todos
            </option>

            {productStatuses.map(
              (status) => (
                <option
                  value={status}
                  key={status}
                >
                  {formatStatus(
                    status,
                  )}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="product-order">
            Ordenação
          </label>

          <select
            id="product-order"
            value={`${draftFilters.sortBy}-${draftFilters.sortOrder}`}
            onChange={(event) => {
              const [
                sortBy,
                sortOrder,
              ] =
                event.target.value.split(
                  "-",
                );

              setDraftFilters(
                (current) => ({
                  ...current,

                  sortBy:
                    sortBy as ProductFilters["sortBy"],

                  sortOrder:
                    sortOrder as ProductFilters["sortOrder"],
                }),
              );
            }}
          >
            <option value="createdAt-desc">
              Mais recentes
            </option>

            <option value="createdAt-asc">
              Mais antigos
            </option>

            <option value="name-asc">
              Nome A–Z
            </option>

            <option value="name-desc">
              Nome Z–A
            </option>

            <option value="updatedAt-desc">
              Atualizados recentemente
            </option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={clearFilters}
          >
            Limpar
          </button>

          <button
            type="submit"
            className="compact-primary-button"
          >
            <Search size={17} />
            Filtrar
          </button>
        </div>
      </form>

      <section className="products-list-panel">
        {loading ? (
          <div className="orders-state">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <div className="orders-state">
            <Box size={34} />

            <strong>
              Nenhum produto encontrado.
            </strong>

            <span>
              Crie um produto ou altere
              os filtros.
            </span>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(
              (product) => {
                const image =
                  getPrimaryImage(
                    product,
                  );

                const minimumPrice =
                  getMinimumPrice(
                    product,
                  );

                const availableStock =
                  getAvailableStock(
                    product,
                  );

                return (
                  <article
                    className="product-card"
                    key={
                      product.publicId
                    }
                  >
                    <div className="product-card-image">
                      {image ? (
                        <img
                          src={image.url}
                          alt={
                            image.altText ??
                            product.name
                          }
                        />
                      ) : (
                        <ImageIcon
                          size={34}
                        />
                      )}

                      <span
                        className={`product-status product-status-${product.status.toLowerCase()}`}
                      >
                        {formatStatus(
                          product.status,
                        )}
                      </span>

                      {product.isFeatured && (
                        <span className="featured-label">
                          <Star
                            size={13}
                            fill="currentColor"
                          />

                          Destaque
                        </span>
                      )}
                    </div>

                    <div className="product-card-content">
                      <span className="product-category-name">
                        {
                          product.category
                            .name
                        }
                      </span>

                      <h2>
                        {product.name}
                      </h2>

                      <span className="product-slug">
                        /{product.slug}
                      </span>

                      <p>
                        {product.shortDescription ??
                          "Nenhuma descrição curta informada."}
                      </p>

                      <div className="product-card-metrics">
                        <div>
                          <span>
                            Preço inicial
                          </span>

                          <strong>
                            {minimumPrice !==
                            null
                              ? formatMoney(
                                  minimumPrice,
                                )
                              : "Sem preço"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Estoque disponível
                          </span>

                          <strong>
                            {availableStock}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Variações
                          </span>

                          <strong>
                            {
                              product
                                .variants
                                .length
                            }
                          </strong>
                        </div>
                      </div>

                      <small>
                        Atualizado em{" "}
                        {formatDate(
                          product.updatedAt,
                        )}
                      </small>
                    </div>

                    <div className="product-card-controls">
                      <label>
                        <span>Status</span>

                        <select
                          value={
                            product.status
                          }
                          disabled={
                            changingStatusId ===
                            product.publicId
                          }
                          onChange={(event) => {
                            void updateStatus(
                              product,

                              event.target
                                .value as
                                ProductStatus,
                            );
                          }}
                        >
                          {productStatuses.map(
                            (status) => (
                              <option
                                value={
                                  status
                                }
                                key={
                                  status
                                }
                              >
                                {formatStatus(
                                  status,
                                )}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <button
                        type="button"
                        className={
                          product.isFeatured
                            ? "product-feature-button active"
                            : "product-feature-button"
                        }
                        disabled={
                          changingFeaturedId ===
                            product.publicId ||
                          product.status !==
                            "ACTIVE"
                        }
                        onClick={() => {
                          void toggleFeatured(
                            product,
                          );
                        }}
                        title={
                          product.status !==
                          "ACTIVE"
                            ? "Somente produtos ativos podem receber destaque"
                            : undefined
                        }
                      >
                        {changingFeaturedId ===
                        product.publicId ? (
                          <LoaderCircle
                            size={16}
                            className="icon-spinning"
                          />
                        ) : (
                          <Sparkles
                            size={16}
                          />
                        )}

                        {product.isFeatured
                          ? "Remover destaque"
                          : "Destacar"}
                      </button>
                    </div>

                    <footer className="product-card-footer">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            product,
                          )
                        }
                      >
                        <Edit3 size={16} />
                        Editar dados
                      </button>

                      <button
                        type="button"
                        disabled={
                            product.status ===
                            "ARCHIVED"
                        }
                        title={
                            product.status ===
                            "ARCHIVED"
                            ? "Produtos arquivados não podem receber variações"
                            : undefined
                        }
                        onClick={() =>
                            setVariantsProduct(
                            product,
                            )
                        }
                        >
                        <Package size={16} />
                        Variações
                        </button>
                    </footer>
                  </article>
                );
              },
            )}
          </div>
        )}

        {!loading &&
          pagination.totalItems >
            0 && (
            <footer className="pagination-footer">
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
                  className="pagination-button"
                  disabled={
                    !pagination.hasPreviousPage
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
                    size={18}
                  />
                </button>

                <button
                  type="button"
                  className="pagination-button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1,
                    )
                  }
                >
                  <ChevronRight
                    size={18}
                  />
                </button>
              </div>
            </footer>
          )}
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >
          <section
            className="product-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="category-modal-header">
              <div>
                <span className="eyebrow">
                  {editingProduct
                    ? "EDIÇÃO"
                    : "CADASTRO"}
                </span>

                <h2>
                  {editingProduct
                    ? "Editar produto"
                    : "Novo produto"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={21} />
              </button>
            </header>

            <form
              className="product-form"
              onSubmit={
                handleSave
              }
            >
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}

              {!editingProduct && (
                <div className="product-draft-notice">
                  <CircleOff
                    size={18}
                  />

                  <div>
                    <strong>
                      Produto criado como
                      rascunho
                    </strong>

                    <span>
                      Adicione imagens e
                      variações antes de
                      ativá-lo.
                    </span>
                  </div>
                </div>
              )}

              <div className="product-form-grid">
                <label className="product-form-full">
                  <span>
                    Nome do produto
                  </span>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          name:
                            event.target
                              .value,
                        }),
                      )
                    }
                    minLength={2}
                    maxLength={150}
                    required
                    autoFocus
                    placeholder="Ex.: Tênis Nike Air"
                  />
                </label>

                <label>
                  <span>
                    Categoria
                  </span>

                  <select
                    value={
                      form.categoryId
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          categoryId:
                            event.target
                              .value,
                        }),
                      )
                    }
                    required
                  >
                    <option value="">
                      Selecione
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          value={
                            category.id
                          }
                          key={
                            category.id
                          }
                          disabled={
                            !category.isActive
                          }
                        >
                          {category.name}
                          {!category.isActive
                            ? " — Inativa"
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span>Marca</span>

                  <input
                    value={form.brand}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          brand:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={100}
                    placeholder="Ex.: Nike"
                  />
                </label>

                <label className="product-form-full">
                  <span>
                    Descrição curta
                  </span>

                  <textarea
                    value={
                      form.shortDescription
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          shortDescription:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={500}
                    rows={3}
                    placeholder="Resumo exibido nos cards e resultados"
                  />

                  <small>
                    {
                      form.shortDescription
                        .length
                    }
                    /500
                  </small>
                </label>

                <label className="product-form-full">
                  <span>
                    Descrição completa
                  </span>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          description:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={5000}
                    rows={8}
                    placeholder="Detalhes completos do produto"
                  />

                  <small>
                    {
                      form.description
                        .length
                    }
                    /5000
                  </small>
                </label>
              </div>

              <section className="product-seo-section">
                <div>
                  <span className="eyebrow">
                    SEO
                  </span>

                  <h3>
                    Resultado de busca
                  </h3>
                </div>

                <label>
                  <span>
                    Título SEO
                  </span>

                  <input
                    value={
                      form.seoTitle
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          seoTitle:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={70}
                    placeholder="Título para buscadores"
                  />

                  <small>
                    {form.seoTitle.length}
                    /70
                  </small>
                </label>

                <label>
                  <span>
                    Descrição SEO
                  </span>

                  <textarea
                    value={
                      form.seoDescription
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,

                          seoDescription:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={160}
                    rows={3}
                    placeholder="Descrição para buscadores"
                  />

                  <small>
                    {
                      form.seoDescription
                        .length
                    }
                    /160
                  </small>
                </label>
              </section>

              {editingProduct && (
                <div className="category-slug-info">
                  <span>Slug atual</span>

                  <strong>
                    /{editingProduct.slug}
                  </strong>

                  <small>
                    O backend atualizará o
                    slug automaticamente
                    quando apropriado.
                  </small>
                </div>
              )}

              <footer className="category-form-footer">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="compact-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="icon-spinning"
                      />

                      Salvando...
                    </>
                  ) : editingProduct ? (
                    "Salvar alterações"
                  ) : (
                    "Criar produto"
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      
      )}
      <ProductVariantsModal
        product={variantsProduct}
        open={Boolean(
            variantsProduct,
        )}
        onClose={() =>
            setVariantsProduct(null)
        }
        onChanged={
            loadProducts
        }
        />
    </div>
    
  );
}