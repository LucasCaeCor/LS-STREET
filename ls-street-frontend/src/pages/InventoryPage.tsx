import {
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
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
  apiRequest,
} from "../lib/api";

import type {
  CategoryPagination,
} from "../types/categories";

import type {
  InventoryMovement,
  InventoryMovementsResponse,
  InventoryMovementType,
  InventoryVariantOverview,
} from "../types/inventory";

import type {
  Product,
  ProductsResponse,
} from "../types/products";

type InventoryTab =
  | "stock"
  | "movements";

type VariantStatusFilter =
  | ""
  | "active"
  | "inactive";

interface MovementFilters {
  search: string;

  type:
    | InventoryMovementType
    | "";

  sortOrder:
    | "asc"
    | "desc";
}

interface AdjustmentForm {
  type:
    | "INITIAL"
    | "PURCHASE"
    | "RETURN"
    | "ADJUSTMENT"
    | "CANCELLATION";

  quantity: string;
  reason: string;
  referenceId: string;
}

const stockPageSize = 20;

const emptyPagination:
  CategoryPagination = {
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

const initialMovementFilters:
  MovementFilters = {
    search: "",
    type: "",
    sortOrder: "desc",
  };

const initialAdjustmentForm:
  AdjustmentForm = {
    type: "ADJUSTMENT",
    quantity: "",
    reason: "",
    referenceId: "",
  };

const movementTypes:
  InventoryMovementType[] = [
    "INITIAL",
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "CANCELLATION",
  ];

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

function formatMovementType(
  type: InventoryMovementType,
) {
  const labels: Record<
    InventoryMovementType,
    string
  > = {
    INITIAL: "Estoque inicial",
    PURCHASE: "Compra/entrada",
    SALE: "Venda",
    RETURN: "Devolução",
    ADJUSTMENT: "Ajuste manual",
    CANCELLATION:
      "Cancelamento",
  };

  return labels[type];
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

function createVariantOverview(
  product: Product,
): InventoryVariantOverview[] {
  const image =
    getPrimaryImage(product);

  return product.variants.map(
    (variant) => {
      const availableStock =
        Math.max(
          0,
          variant.stock -
            variant.reservedStock,
        );

      return {
        variantId:
          variant.publicId,

        productId:
          product.publicId,

        productName:
          product.name,

        productSlug:
          product.slug,

        productStatus:
          product.status,

        imageUrl:
          image?.url ?? null,

        sku: variant.sku,

        color:
          variant.color ?? null,

        size:
          variant.size ?? null,

        stock: variant.stock,

        reservedStock:
          variant.reservedStock,

        availableStock,

        lowStockThreshold:
          variant.lowStockThreshold,

        isLowStock:
          availableStock <=
          variant.lowStockThreshold,

        isActive:
          variant.isActive,
      };
    },
  );
}

export function InventoryPage() {
  const [activeTab, setActiveTab] =
    useState<InventoryTab>(
      "stock",
    );

  const [
    variants,
    setVariants,
  ] = useState<
    InventoryVariantOverview[]
  >([]);

  const [
    movements,
    setMovements,
  ] = useState<
    InventoryMovement[]
  >([]);

  const [
    movementPagination,
    setMovementPagination,
  ] =
    useState<CategoryPagination>(
      emptyPagination,
    );

  const [
    loadingStock,
    setLoadingStock,
  ] = useState(true);

  const [
    loadingMovements,
    setLoadingMovements,
  ] = useState(false);

  const [stockError, setStockError] =
    useState("");

  const [
    movementsError,
    setMovementsError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    stockSearch,
    setStockSearch,
  ] = useState("");

  const [
    variantStatus,
    setVariantStatus,
  ] =
    useState<VariantStatusFilter>(
      "",
    );

  const [
    lowStockOnly,
    setLowStockOnly,
  ] = useState(false);

  const [
    stockPage,
    setStockPage,
  ] = useState(1);

  const [
    movementPage,
    setMovementPage,
  ] = useState(1);

  const [
    movementDraftFilters,
    setMovementDraftFilters,
  ] =
    useState<MovementFilters>(
      initialMovementFilters,
    );

  const [
    movementFilters,
    setMovementFilters,
  ] =
    useState<MovementFilters>(
      initialMovementFilters,
    );

  const [
    selectedVariant,
    setSelectedVariant,
  ] =
    useState<
      InventoryVariantOverview | null
    >(null);

  const [
    adjustmentForm,
    setAdjustmentForm,
  ] =
    useState<AdjustmentForm>(
      initialAdjustmentForm,
    );

  const [
    adjustmentError,
    setAdjustmentError,
  ] = useState("");

  const [
    savingAdjustment,
    setSavingAdjustment,
  ] = useState(false);

  const loadStock =
    useCallback(async () => {
      setLoadingStock(true);
      setStockError("");

      try {
        const firstResponse =
          await apiRequest<
            ProductsResponse
          >(
            "/products/admin?page=1&limit=100&sortBy=name&sortOrder=asc",
          );

        const allProducts = [
          ...firstResponse.data,
        ];

        const totalPages =
          firstResponse.pagination
            .totalPages;

        if (totalPages > 1) {
          const remainingRequests =
            Array.from(
              {
                length:
                  totalPages - 1,
              },
              (_, index) =>
                apiRequest<
                  ProductsResponse
                >(
                  `/products/admin?page=${index + 2}&limit=100&sortBy=name&sortOrder=asc`,
                ),
            );

          const remainingResponses =
            await Promise.all(
              remainingRequests,
            );

          remainingResponses.forEach(
            (response) => {
              allProducts.push(
                ...response.data,
              );
            },
          );
        }

        const allVariants =
          allProducts.flatMap(
            createVariantOverview,
          );

        allVariants.sort(
          (first, second) => {
            const productResult =
              first.productName.localeCompare(
                second.productName,
                "pt-BR",
              );

            if (
              productResult !== 0
            ) {
              return productResult;
            }

            return first.sku.localeCompare(
              second.sku,
              "pt-BR",
            );
          },
        );

        setVariants(allVariants);
      } catch (caughtError) {
        setVariants([]);

        setStockError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível carregar o estoque.",
        );
      } finally {
        setLoadingStock(false);
      }
    }, []);

  const loadMovements =
    useCallback(async () => {
      setLoadingMovements(true);
      setMovementsError("");

      const query =
        new URLSearchParams();

      query.set(
        "page",
        String(movementPage),
      );

      query.set(
        "limit",
        "20",
      );

      query.set(
        "sortOrder",
        movementFilters.sortOrder,
      );

      if (
        movementFilters.search
      ) {
        query.set(
          "search",
          movementFilters.search,
        );
      }

      if (
        movementFilters.type
      ) {
        query.set(
          "type",
          movementFilters.type,
        );
      }

      try {
        const response =
          await apiRequest<
            InventoryMovementsResponse
          >(
            `/admin/inventory/movements?${query.toString()}`,
          );

        setMovements(
          response.data,
        );

        setMovementPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setMovements([]);

        setMovementPagination(
          emptyPagination,
        );

        setMovementsError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível carregar as movimentações.",
        );
      } finally {
        setLoadingMovements(false);
      }
    }, [
      movementFilters,
      movementPage,
    ]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadStock();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadStock]);

  useEffect(() => {
    if (
      activeTab !==
      "movements"
    ) {
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        void loadMovements();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    activeTab,
    loadMovements,
  ]);

  const summary = useMemo(
    () => ({
      totalVariants:
        variants.length,

      totalStock:
        variants.reduce(
          (
            total,
            variant,
          ) =>
            total +
            variant.stock,
          0,
        ),

      reservedStock:
        variants.reduce(
          (
            total,
            variant,
          ) =>
            total +
            variant.reservedStock,
          0,
        ),

      availableStock:
        variants.reduce(
          (
            total,
            variant,
          ) =>
            total +
            variant.availableStock,
          0,
        ),

      lowStock:
        variants.filter(
          (variant) =>
            variant.isLowStock,
        ).length,
    }),
    [variants],
  );

  const filteredVariants =
    useMemo(() => {
      const normalizedSearch =
        stockSearch
          .trim()
          .toLowerCase();

      return variants.filter(
        (variant) => {
          const matchesSearch =
            !normalizedSearch ||
            variant.productName
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            variant.sku
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              variant.color ?? ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            (
              variant.size ?? ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            !variantStatus ||
            (
              variantStatus ===
              "active"
                ? variant.isActive
                : !variant.isActive
            );

          const matchesLowStock =
            !lowStockOnly ||
            variant.isLowStock;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesLowStock
          );
        },
      );
    }, [
      variants,
      stockSearch,
      variantStatus,
      lowStockOnly,
    ]);

  const totalStockPages =
    Math.max(
      1,
      Math.ceil(
        filteredVariants.length /
          stockPageSize,
      ),
    );

  const currentStockPage =
    Math.min(
      stockPage,
      totalStockPages,
    );

  const visibleVariants =
    useMemo(() => {
      const start =
        (currentStockPage - 1) *
        stockPageSize;

      return filteredVariants.slice(
        start,
        start + stockPageSize,
      );
    }, [
      filteredVariants,
      currentStockPage,
    ]);

  function clearStockFilters() {
    setStockSearch("");
    setVariantStatus("");
    setLowStockOnly(false);
    setStockPage(1);
  }

  function applyMovementFilters(
    event: FormEvent,
  ) {
    event.preventDefault();

    setMovementPage(1);

    setMovementFilters({
      ...movementDraftFilters,

      search:
        movementDraftFilters
          .search
          .trim(),
    });
  }

  function clearMovementFilters() {
    setMovementDraftFilters(
      initialMovementFilters,
    );

    setMovementFilters(
      initialMovementFilters,
    );

    setMovementPage(1);
  }

  function openAdjustment(
    variant:
      InventoryVariantOverview,
  ) {
    setSelectedVariant(
      variant,
    );

    setAdjustmentForm(
      initialAdjustmentForm,
    );

    setAdjustmentError("");
  }

  function closeAdjustment() {
    if (savingAdjustment) {
      return;
    }

    setSelectedVariant(null);

    setAdjustmentForm(
      initialAdjustmentForm,
    );

    setAdjustmentError("");
  }

  async function handleAdjustment(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!selectedVariant) {
      return;
    }

    const quantity =
      Number(
        adjustmentForm.quantity,
      );

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity === 0
    ) {
      setAdjustmentError(
        "Informe uma quantidade inteira diferente de zero.",
      );

      return;
    }

    if (
      adjustmentForm.type !==
        "ADJUSTMENT" &&
      quantity < 0
    ) {
      setAdjustmentError(
        "Somente ajustes manuais podem possuir quantidade negativa.",
      );

      return;
    }

    const reason =
      adjustmentForm.reason.trim();

    if (
      reason &&
      reason.length < 3
    ) {
      setAdjustmentError(
        "O motivo deve possuir pelo menos 3 caracteres.",
      );

      return;
    }

    setSavingAdjustment(true);
    setAdjustmentError("");

    try {
      await apiRequest(
        `/admin/inventory/${selectedVariant.variantId}/adjust`,
        {
          method: "POST",

          body: JSON.stringify({
            type:
              adjustmentForm.type,

            quantity,

            reason:
              reason || undefined,

            referenceId:
              adjustmentForm
                .referenceId
                .trim() ||
              undefined,
          }),
        },
      );

      setSuccessMessage(
        "Estoque atualizado com sucesso.",
      );

      setSelectedVariant(null);

      setAdjustmentForm(
        initialAdjustmentForm,
      );

      await loadStock();

      if (
        activeTab ===
        "movements"
      ) {
        await loadMovements();
      }
    } catch (caughtError) {
      setAdjustmentError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível ajustar o estoque.",
      );
    } finally {
      setSavingAdjustment(false);
    }
  }

  return (
    <div className="inventory-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            INVENTÁRIO
          </span>

          <h1>Estoque</h1>

          <p>
            Acompanhe quantidades,
            reservas e movimentações.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          disabled={
            loadingStock ||
            loadingMovements
          }
          onClick={() => {
            void loadStock();

            if (
              activeTab ===
              "movements"
            ) {
              void loadMovements();
            }
          }}
        >
          <RefreshCw
            size={17}
            className={
              loadingStock ||
              loadingMovements
                ? "icon-spinning"
                : ""
            }
          />

          Atualizar
        </button>
      </header>

      {successMessage && (
        <div className="category-success-message">
          <CheckCircle2
            size={18}
          />

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

      <section className="inventory-summary-grid">
        <article>
          <Boxes size={21} />

          <div>
            <span>Variações</span>

            <strong>
              {summary.totalVariants}
            </strong>
          </div>
        </article>

        <article>
          <PackageCheck size={21} />

          <div>
            <span>
              Estoque total
            </span>

            <strong>
              {summary.totalStock}
            </strong>
          </div>
        </article>

        <article>
          <LockKeyhole size={21} />

          <div>
            <span>Reservado</span>

            <strong>
              {summary.reservedStock}
            </strong>
          </div>
        </article>

        <article>
          <PackageCheck size={21} />

          <div>
            <span>Disponível</span>

            <strong>
              {summary.availableStock}
            </strong>
          </div>
        </article>

        <article
          className={
            summary.lowStock > 0
              ? "inventory-warning-card"
              : ""
          }
        >
          <TriangleAlert
            size={21}
          />

          <div>
            <span>
              Estoque baixo
            </span>

            <strong>
              {summary.lowStock}
            </strong>
          </div>
        </article>
      </section>

      <div className="inventory-tabs">
        <button
          type="button"
          className={
            activeTab === "stock"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("stock")
          }
        >
          <Boxes size={18} />
          Visão geral
        </button>

        <button
          type="button"
          className={
            activeTab ===
            "movements"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "movements",
            )
          }
        >
          <History size={18} />
          Movimentações
        </button>
      </div>

      {activeTab === "stock" && (
        <>
          {stockError && (
            <div className="form-error">
              {stockError}
            </div>
          )}

          <section className="inventory-filter-panel">
            <div className="inventory-search">
              <Search size={17} />

              <input
                value={stockSearch}
                onChange={(event) => {
                  setStockSearch(
                    event.target.value,
                  );

                  setStockPage(1);
                }}
                placeholder="Produto, SKU, cor ou tamanho"
              />
            </div>

            <select
              value={variantStatus}
              onChange={(event) => {
                setVariantStatus(
                  event.target
                    .value as
                    VariantStatusFilter,
                );

                setStockPage(1);
              }}
            >
              <option value="">
                Todas as variações
              </option>

              <option value="active">
                Somente ativas
              </option>

              <option value="inactive">
                Somente inativas
              </option>
            </select>

            <label className="inventory-checkbox-filter">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(event) => {
                  setLowStockOnly(
                    event.target.checked,
                  );

                  setStockPage(1);
                }}
              />

              Apenas estoque baixo
            </label>

            <button
              type="button"
              className="ghost-button"
              onClick={
                clearStockFilters
              }
            >
              Limpar
            </button>
          </section>

          <section className="inventory-panel">
            {loadingStock ? (
              <div className="inventory-state">
                <LoaderCircle
                  size={28}
                  className="icon-spinning"
                />

                Carregando estoque...
              </div>
            ) : visibleVariants.length ===
              0 ? (
              <div className="inventory-state">
                <Boxes size={34} />

                <strong>
                  Nenhuma variação
                  encontrada.
                </strong>

                <span>
                  Cadastre uma variação
                  ou altere os filtros.
                </span>
              </div>
            ) : (
              <div className="inventory-table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Variação</th>
                      <th>Total</th>
                      <th>Reservado</th>
                      <th>Disponível</th>
                      <th>Limite</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {visibleVariants.map(
                      (variant) => (
                        <tr
                          key={
                            variant.variantId
                          }
                        >
                          <td>
                            <div className="inventory-product-cell">
                              <div className="inventory-product-image">
                                {variant.imageUrl ? (
                                  <img
                                    src={
                                      variant.imageUrl
                                    }
                                    alt={
                                      variant.productName
                                    }
                                  />
                                ) : (
                                  <ImageIcon
                                    size={20}
                                  />
                                )}
                              </div>

                              <div>
                                <strong>
                                  {
                                    variant.productName
                                  }
                                </strong>

                                <span>
                                  {
                                    variant.productStatus
                                  }
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong>
                              {variant.sku}
                            </strong>

                            <span>
                              {variant.color ??
                                "Sem cor"}

                              {" · "}

                              {variant.size ??
                                "Sem tamanho"}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {variant.stock}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {
                                variant.reservedStock
                              }
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={
                                variant.isLowStock
                                  ? "inventory-low-stock"
                                  : ""
                              }
                            >
                              {
                                variant.availableStock
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              variant.lowStockThreshold
                            }
                          </td>

                          <td>
                            <span
                              className={
                                variant.isActive
                                  ? "inventory-status active"
                                  : "inventory-status inactive"
                              }
                            >
                              {variant.isActive
                                ? "Ativa"
                                : "Inativa"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="inventory-adjust-button"
                              onClick={() =>
                                openAdjustment(
                                  variant,
                                )
                              }
                            >
                              <SlidersHorizontal
                                size={16}
                              />

                              Ajustar
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingStock &&
              filteredVariants.length >
                0 && (
                <footer className="pagination-footer">
                  <span>
                    Página{" "}
                    {currentStockPage} de{" "}
                    {totalStockPages}
                  </span>

                  <div>
                    <button
                      type="button"
                      className="pagination-button"
                      disabled={
                        currentStockPage <=
                        1
                      }
                      onClick={() =>
                        setStockPage(
                          (current) =>
                            Math.max(
                              1,
                              current -
                                1,
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
                        currentStockPage >=
                        totalStockPages
                      }
                      onClick={() =>
                        setStockPage(
                          (current) =>
                            Math.min(
                              totalStockPages,
                              current +
                                1,
                            ),
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
        </>
      )}

      {activeTab ===
        "movements" && (
        <>
          {movementsError && (
            <div className="form-error">
              {movementsError}
            </div>
          )}

          <form
            className="movement-filter-panel"
            onSubmit={
              applyMovementFilters
            }
          >
            <div className="inventory-search">
              <Search size={17} />

              <input
                value={
                  movementDraftFilters
                    .search
                }
                onChange={(event) =>
                  setMovementDraftFilters(
                    (current) => ({
                      ...current,

                      search:
                        event.target
                          .value,
                    }),
                  )
                }
                placeholder="Produto, SKU, motivo ou referência"
              />
            </div>

            <select
              value={
                movementDraftFilters
                  .type
              }
              onChange={(event) =>
                setMovementDraftFilters(
                  (current) => ({
                    ...current,

                    type:
                      event.target
                        .value as
                        | InventoryMovementType
                        | "",
                  }),
                )
              }
            >
              <option value="">
                Todos os tipos
              </option>

              {movementTypes.map(
                (type) => (
                  <option
                    value={type}
                    key={type}
                  >
                    {formatMovementType(
                      type,
                    )}
                  </option>
                ),
              )}
            </select>

            <select
              value={
                movementDraftFilters
                  .sortOrder
              }
              onChange={(event) =>
                setMovementDraftFilters(
                  (current) => ({
                    ...current,

                    sortOrder:
                      event.target
                        .value as
                        | "asc"
                        | "desc",
                  }),
                )
              }
            >
              <option value="desc">
                Mais recentes
              </option>

              <option value="asc">
                Mais antigas
              </option>
            </select>

            <button
              type="button"
              className="ghost-button"
              onClick={
                clearMovementFilters
              }
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
          </form>

          <section className="inventory-panel">
            {loadingMovements ? (
              <div className="inventory-state">
                <LoaderCircle
                  size={28}
                  className="icon-spinning"
                />

                Carregando
                movimentações...
              </div>
            ) : movements.length ===
              0 ? (
              <div className="inventory-state">
                <History size={34} />

                <strong>
                  Nenhuma movimentação
                  encontrada.
                </strong>
              </div>
            ) : (
              <div className="inventory-table-wrapper">
                <table className="inventory-table movement-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Tipo</th>
                      <th>Quantidade</th>
                      <th>Estoque</th>
                      <th>Motivo</th>
                      <th>Data</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movements.map(
                      (movement) => (
                        <tr
                          key={
                            movement.publicId
                          }
                        >
                          <td>
                            <div className="inventory-product-cell">
                              <div className="inventory-product-image">
                                {movement.variant
                                  .product
                                  .imageUrl ? (
                                  <img
                                    src={
                                      movement
                                        .variant
                                        .product
                                        .imageUrl
                                    }
                                    alt={
                                      movement
                                        .variant
                                        .product
                                        .name
                                    }
                                  />
                                ) : (
                                  <ImageIcon
                                    size={20}
                                  />
                                )}
                              </div>

                              <div>
                                <strong>
                                  {
                                    movement
                                      .variant
                                      .product
                                      .name
                                  }
                                </strong>

                                <span>
                                  {
                                    movement
                                      .variant
                                      .sku
                                  }

                                  {" · "}

                                  {movement
                                    .variant
                                    .color ??
                                    "Sem cor"}

                                  {" · "}

                                  {movement
                                    .variant
                                    .size ??
                                    "Sem tamanho"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`movement-type movement-type-${movement.type.toLowerCase()}`}
                            >
                              {formatMovementType(
                                movement.type,
                              )}
                            </span>
                          </td>

                          <td>
                            <strong
                              className={
                                movement.quantity >
                                0
                                  ? "movement-positive"
                                  : "movement-negative"
                              }
                            >
                              {movement.quantity >
                                0 && "+"}

                              {
                                movement.quantity
                              }
                            </strong>
                          </td>

                          <td>
                            <div className="movement-stock-change">
                              <span>
                                {
                                  movement.previousStock
                                }
                              </span>

                              {movement.newStock >=
                              movement.previousStock ? (
                                <ArrowUp
                                  size={15}
                                />
                              ) : (
                                <ArrowDown
                                  size={15}
                                />
                              )}

                              <strong>
                                {
                                  movement.newStock
                                }
                              </strong>
                            </div>
                          </td>

                          <td>
                            <strong>
                              {movement.reason ??
                                "Sem motivo informado"}
                            </strong>

                            {movement.referenceId && (
                              <span>
                                Ref.:{" "}
                                {
                                  movement.referenceId
                                }
                              </span>
                            )}
                          </td>

                          <td>
                            {formatDate(
                              movement.createdAt,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingMovements &&
              movementPagination
                .totalItems > 0 && (
                <footer className="pagination-footer">
                  <span>
                    Página{" "}
                    {
                      movementPagination.page
                    }{" "}
                    de{" "}
                    {Math.max(
                      movementPagination
                        .totalPages,
                      1,
                    )}
                  </span>

                  <div>
                    <button
                      type="button"
                      className="pagination-button"
                      disabled={
                        !movementPagination
                          .hasPreviousPage
                      }
                      onClick={() =>
                        setMovementPage(
                          (current) =>
                            Math.max(
                              1,
                              current -
                                1,
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
                        !movementPagination
                          .hasNextPage
                      }
                      onClick={() =>
                        setMovementPage(
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
        </>
      )}

      {selectedVariant && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeAdjustment
          }
        >
          <section
            className="inventory-adjustment-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="category-modal-header">
              <div>
                <span className="eyebrow">
                  AJUSTE DE ESTOQUE
                </span>

                <h2>
                  {
                    selectedVariant.productName
                  }
                </h2>

                <p>
                  {selectedVariant.sku}

                  {" · "}

                  {selectedVariant.color ??
                    "Sem cor"}

                  {" · "}

                  {selectedVariant.size ??
                    "Sem tamanho"}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={
                  closeAdjustment
                }
                disabled={
                  savingAdjustment
                }
              >
                <X size={21} />
              </button>
            </header>

            <form
              className="inventory-adjustment-form"
              onSubmit={
                handleAdjustment
              }
            >
              {adjustmentError && (
                <div className="form-error">
                  {adjustmentError}
                </div>
              )}

              <section className="inventory-current-stock">
                <div>
                  <span>Total</span>

                  <strong>
                    {
                      selectedVariant.stock
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Reservado
                  </span>

                  <strong>
                    {
                      selectedVariant.reservedStock
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Disponível
                  </span>

                  <strong>
                    {
                      selectedVariant.availableStock
                    }
                  </strong>
                </div>
              </section>

              <label>
                <span>
                  Tipo de movimentação
                </span>

                <select
                  value={
                    adjustmentForm.type
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,

                        type:
                          event.target
                            .value as
                            AdjustmentForm["type"],
                      }),
                    )
                  }
                >
                  <option value="ADJUSTMENT">
                    Ajuste manual
                  </option>

                  <option value="PURCHASE">
                    Compra/entrada
                  </option>

                  <option value="RETURN">
                    Devolução
                  </option>

                  <option value="CANCELLATION">
                    Cancelamento
                  </option>

                  <option value="INITIAL">
                    Estoque inicial
                  </option>
                </select>
              </label>

              <label>
                <span>Quantidade</span>

                <input
                  type="number"
                  step={1}
                  value={
                    adjustmentForm.quantity
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,

                        quantity:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder={
                    adjustmentForm.type ===
                    "ADJUSTMENT"
                      ? "Ex.: 10 ou -3"
                      : "Ex.: 10"
                  }
                  required
                  autoFocus
                />

                <small>
                  Número positivo adiciona
                  estoque. No ajuste
                  manual, número negativo
                  remove estoque.
                </small>
              </label>

              <label>
                <span>Motivo</span>

                <textarea
                  value={
                    adjustmentForm.reason
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,

                        reason:
                          event.target
                            .value,
                      }),
                    )
                  }
                  rows={4}
                  maxLength={300}
                  placeholder="Ex.: Entrada de nova mercadoria"
                />
              </label>

              <label>
                <span>
                  Referência
                </span>

                <input
                  value={
                    adjustmentForm.referenceId
                  }
                  onChange={(event) =>
                    setAdjustmentForm(
                      (current) => ({
                        ...current,

                        referenceId:
                          event.target
                            .value,
                      }),
                    )
                  }
                  maxLength={100}
                  placeholder="Ex.: NF-1234"
                />
              </label>

              <footer className="variant-form-footer">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={
                    closeAdjustment
                  }
                  disabled={
                    savingAdjustment
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="compact-primary-button"
                  disabled={
                    savingAdjustment
                  }
                >
                  {savingAdjustment ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="icon-spinning"
                      />

                      Ajustando...
                    </>
                  ) : (
                    "Confirmar ajuste"
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}