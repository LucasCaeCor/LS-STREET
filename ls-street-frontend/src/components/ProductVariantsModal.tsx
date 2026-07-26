import {
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  Edit3,
  LoaderCircle,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
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
  ApiError,
} from "../lib/api";

import type {
  ManagedProductVariant,
  ProductVariantResponse,
  ProductVariantsResponse,
} from "../types/product-variants";

import type {
  Product,
} from "../types/products";

interface ProductVariantsModalProps {
  product: Product | null;
  open: boolean;

  onClose(): void;

  onChanged():
    | Promise<void>
    | void;
}

type ModalView =
  | "list"
  | "form"
  | "stock";

interface VariantForm {
  sku: string;

  color: string;
  size: string;

  price: string;
  compareAtPrice: string;
  cost: string;

  stock: string;
  lowStockThreshold: string;

  barcode: string;

  weightInGrams: string;

  height: string;
  width: string;
  length: string;

  isActive: boolean;
}

interface StockForm {
  quantity: string;
  reason: string;
}

const initialVariantForm:
  VariantForm = {
    sku: "",

    color: "",
    size: "",

    price: "",
    compareAtPrice: "",
    cost: "",

    stock: "0",
    lowStockThreshold: "5",

    barcode: "",

    weightInGrams: "",

    height: "",
    width: "",
    length: "",

    isActive: true,
  };

const initialStockForm:
  StockForm = {
    quantity: "",
    reason: "",
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
  ).format(valueInCents / 100);
}

function centsToInput(
  valueInCents:
    | number
    | null,
) {
  if (valueInCents === null) {
    return "";
  }

  return (
    valueInCents / 100
  )
    .toFixed(2)
    .replace(".", ",");
}

function moneyInputToCents(
  value: string,
):
  | number
  | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const amount =
    Number(normalized);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return null;
  }

  return Math.round(
    amount * 100,
  );
}

function optionalNumber(
  value: string,
):
  | number
  | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized =
    trimmed.replace(",", ".");

  const number =
    Number(normalized);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

function optionalInteger(
  value: string,
):
  | number
  | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const number =
    Number(trimmed);

  if (
    !Number.isInteger(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}

export function ProductVariantsModal({
  product,
  open,
  onClose,
  onChanged,
}: ProductVariantsModalProps) {
  const productId =
    product?.publicId;

  const [
    variants,
    setVariants,
  ] = useState<
    ManagedProductVariant[]
  >([]);

  const [view, setView] =
    useState<ModalView>("list");

  const [
    editingVariant,
    setEditingVariant,
  ] =
    useState<
      ManagedProductVariant | null
    >(null);

  const [
    stockVariant,
    setStockVariant,
  ] =
    useState<
      ManagedProductVariant | null
    >(null);

  const [form, setForm] =
    useState<VariantForm>(
      initialVariantForm,
    );

  const [
    stockForm,
    setStockForm,
  ] =
    useState<StockForm>(
      initialStockForm,
    );

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "" | "active" | "inactive"
  >("");

  const [
    lowStockOnly,
    setLowStockOnly,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    actionVariantId,
    setActionVariantId,
  ] =
    useState<string | null>(
      null,
    );

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadVariants =
    useCallback(async () => {
      if (
        !open ||
        !productId
      ) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await apiRequest<
            ProductVariantsResponse
          >(
            `/products/admin/${productId}/variants?page=1&limit=100&sortBy=sku&sortOrder=asc`,
          );

        setVariants(
          response.data,
        );
      } catch (caughtError) {
        setVariants([]);

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar as variações.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      open,
      productId,
    ]);

  useEffect(() => {
  if (
    !open ||
    !productId
  ) {
    return;
  }

  const timeoutId =
    window.setTimeout(() => {
      void loadVariants();
    }, 0);

  return () => {
    window.clearTimeout(
      timeoutId,
    );
  };
}, [
  open,
  productId,
  loadVariants,
]);

  const filteredVariants =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return variants.filter(
        (variant) => {
          const matchesSearch =
            !normalizedSearch ||
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
            !statusFilter ||
            (
              statusFilter ===
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
      search,
      statusFilter,
      lowStockOnly,
    ]);

  const totalAvailableStock =
    useMemo(
      () =>
        variants.reduce(
          (
            total,
            variant,
          ) =>
            total +
            variant.availableStock,
          0,
        ),
      [variants],
    );

  const lowStockCount =
    useMemo(
      () =>
        variants.filter(
          (variant) =>
            variant.isLowStock,
        ).length,
      [variants],
    );

  function openCreateForm() {
    setEditingVariant(null);

    setForm(
      initialVariantForm,
    );

    setError("");
    setView("form");
  }

  function openEditForm(
    variant:
      ManagedProductVariant,
  ) {
    setEditingVariant(
      variant,
    );

    setForm({
      sku: variant.sku,

      color:
        variant.color ?? "",

      size:
        variant.size ?? "",

      price:
        centsToInput(
          variant.priceInCents,
        ),

      compareAtPrice:
        centsToInput(
          variant
            .compareAtPriceInCents,
        ),

      cost:
        centsToInput(
          variant.costInCents,
        ),

      stock: String(
        variant.stock,
      ),

      lowStockThreshold:
        String(
          variant
            .lowStockThreshold,
        ),

      barcode:
        variant.barcode ?? "",

      weightInGrams:
        variant.weightInGrams !==
        null
          ? String(
              variant
                .weightInGrams,
            )
          : "",

      height:
        variant.dimensions
          .height !== null
          ? String(
              variant
                .dimensions
                .height,
            )
          : "",

      width:
        variant.dimensions
          .width !== null
          ? String(
              variant
                .dimensions
                .width,
            )
          : "",

      length:
        variant.dimensions
          .length !== null
          ? String(
              variant
                .dimensions
                .length,
            )
          : "",

      isActive:
        variant.isActive,
    });

    setError("");
    setView("form");
  }

  function openStockForm(
    variant:
      ManagedProductVariant,
  ) {
    setStockVariant(variant);

    setStockForm(
      initialStockForm,
    );

    setError("");
    setView("stock");
  }

  function returnToList() {
    if (saving) {
      return;
    }

    setView("list");
    setEditingVariant(null);
    setStockVariant(null);
    setError("");
  }

  function closeModal() {
    if (saving) {
      return;
    }

    onClose();
  }

  async function refreshAll() {
    await loadVariants();
    await onChanged();
  }

  async function handleSave(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!productId) {
      return;
    }

    const sku =
      form.sku
        .trim()
        .toUpperCase();

    if (sku.length < 2) {
      setError(
        "Informe um SKU válido.",
      );

      return;
    }

    const priceInCents =
      moneyInputToCents(
        form.price,
      );

    if (priceInCents === null) {
      setError(
        "Informe um preço válido.",
      );

      return;
    }

    const compareAtPriceInCents =
      form.compareAtPrice.trim()
        ? moneyInputToCents(
            form.compareAtPrice,
          )
        : null;

    if (
      form.compareAtPrice.trim() &&
      compareAtPriceInCents ===
        null
    ) {
      setError(
        "Informe um preço comparativo válido.",
      );

      return;
    }

    if (
      compareAtPriceInCents !==
        null &&
      compareAtPriceInCents <
        priceInCents
    ) {
      setError(
        "O preço comparativo não pode ser menor que o preço atual.",
      );

      return;
    }

    const costInCents =
      form.cost.trim()
        ? moneyInputToCents(
            form.cost,
          )
        : null;

    if (
      form.cost.trim() &&
      costInCents === null
    ) {
      setError(
        "Informe um custo válido.",
      );

      return;
    }

    const lowStockThreshold =
      optionalInteger(
        form.lowStockThreshold,
      );

    if (
      lowStockThreshold === null
    ) {
      setError(
        "Informe um limite de estoque baixo válido.",
      );

      return;
    }

    const weightInGrams =
      form.weightInGrams.trim()
        ? optionalInteger(
            form.weightInGrams,
          )
        : null;

    if (
      form.weightInGrams.trim() &&
      weightInGrams === null
    ) {
      setError(
        "Informe um peso válido em gramas.",
      );

      return;
    }

    const height =
      form.height.trim()
        ? optionalNumber(
            form.height,
          )
        : null;

    const width =
      form.width.trim()
        ? optionalNumber(
            form.width,
          )
        : null;

    const length =
      form.length.trim()
        ? optionalNumber(
            form.length,
          )
        : null;

    if (
      (
        form.height.trim() &&
        height === null
      ) ||
      (
        form.width.trim() &&
        width === null
      ) ||
      (
        form.length.trim() &&
        length === null
      )
    ) {
      setError(
        "Informe dimensões válidas.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingVariant) {
        await apiRequest<
          ProductVariantResponse
        >(
          `/product-variants/admin/${editingVariant.id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              sku,

              color:
                form.color.trim() ||
                null,

              size:
                form.size.trim() ||
                null,

              priceInCents,

              compareAtPriceInCents,

              costInCents,

              lowStockThreshold,

              barcode:
                form.barcode.trim() ||
                null,

              weightInGrams,

              height,
              width,
              length,
            }),
          },
        );

        setSuccessMessage(
          "Variação atualizada com sucesso.",
        );
      } else {
        const stock =
          optionalInteger(
            form.stock,
          );

        if (stock === null) {
          setError(
            "Informe um estoque inicial válido.",
          );

          return;
        }

        await apiRequest<
          ProductVariantResponse
        >(
          `/products/admin/${productId}/variants`,
          {
            method: "POST",

            body: JSON.stringify({
              sku,

              color:
                form.color.trim() ||
                undefined,

              size:
                form.size.trim() ||
                undefined,

              priceInCents,

              compareAtPriceInCents,

              costInCents,

              stock,
              reservedStock: 0,

              lowStockThreshold,

              barcode:
                form.barcode.trim() ||
                null,

              weightInGrams,

              height,
              width,
              length,

              isActive:
                form.isActive,
            }),
          },
        );

        setSuccessMessage(
          "Variação criada com sucesso.",
        );
      }

      setView("list");
      setEditingVariant(null);
      setForm(
        initialVariantForm,
      );

      await refreshAll();
    } catch (caughtError) {
      if (
        caughtError instanceof
        ApiError
      ) {
        setError(
          caughtError.message,
        );
      } else {
        setError(
          "Não foi possível salvar a variação.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    variant:
      ManagedProductVariant,
  ) {
    setActionVariantId(
      variant.id,
    );

    setError("");

    try {
      await apiRequest<
        ProductVariantResponse
      >(
        `/product-variants/admin/${variant.id}/status`,
        {
          method: "PATCH",

          body: JSON.stringify({
            isActive:
              !variant.isActive,
          }),
        },
      );

      setSuccessMessage(
        variant.isActive
          ? "Variação desativada."
          : "Variação ativada.",
      );

      await refreshAll();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível alterar o status.",
      );
    } finally {
      setActionVariantId(
        null,
      );
    }
  }

  async function deleteVariant(
    variant:
      ManagedProductVariant,
  ) {
    const confirmed =
      window.confirm(
        `Excluir a variação ${variant.sku}?`,
      );

    if (!confirmed) {
      return;
    }

    setActionVariantId(
      variant.id,
    );

    setError("");

    try {
      await apiRequest<{
        success: boolean;
        message: string;
      }>(
        `/product-variants/admin/${variant.id}`,
        {
          method: "DELETE",
        },
      );

      setSuccessMessage(
        "Variação excluída com sucesso.",
      );

      await refreshAll();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível excluir a variação.",
      );
    } finally {
      setActionVariantId(
        null,
      );
    }
  }

  async function handleStockAdjustment(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!stockVariant) {
      return;
    }

    const quantity =
      Number(
        stockForm.quantity,
      );

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity === 0
    ) {
      setError(
        "Informe uma quantidade inteira diferente de zero.",
      );

      return;
    }

    const reason =
      stockForm.reason.trim();

    if (
      reason &&
      reason.length < 3
    ) {
      setError(
        "O motivo deve possuir pelo menos 3 caracteres.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        `/admin/inventory/${stockVariant.id}/adjust`,
        {
          method: "POST",

          body: JSON.stringify({
            type: "ADJUSTMENT",
            quantity,

            reason:
              reason ||
              "Ajuste realizado no painel de produtos",
          }),
        },
      );

      setSuccessMessage(
        "Estoque ajustado com sucesso.",
      );

      setView("list");
      setStockVariant(null);
      setStockForm(
        initialStockForm,
      );

      await refreshAll();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível ajustar o estoque.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (
    !open ||
    !product
  ) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={
        closeModal
      }
    >
      <section
        className="variants-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="variants-modal-header">
          <div className="variants-header-title">
            {view !== "list" && (
              <button
                type="button"
                className="variant-back-button"
                onClick={
                  returnToList
                }
                disabled={saving}
              >
                <ArrowLeft
                  size={19}
                />
              </button>
            )}

            <div>
              <span className="eyebrow">
                VARIAÇÕES
              </span>

              <h2>
                {view === "list"
                  ? product.name
                  : view === "form"
                    ? editingVariant
                      ? "Editar variação"
                      : "Nova variação"
                    : "Ajustar estoque"}
              </h2>

              {view === "list" && (
                <p>
                  SKU, preço, tamanho,
                  cor e estoque.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={
              closeModal
            }
            disabled={saving}
          >
            <X size={21} />
          </button>
        </header>

        {view === "list" && (
          <div className="variants-modal-content">
            {successMessage && (
              <div className="category-success-message">
                <span>
                  {successMessage}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setSuccessMessage(
                      "",
                    )
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

            <div className="variants-toolbar">
              <div className="variant-search">
                <Search size={17} />

                <input
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Buscar por SKU, cor ou tamanho"
                />
              </div>

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | ""
                      | "active"
                      | "inactive",
                  )
                }
              >
                <option value="">
                  Todas
                </option>

                <option value="active">
                  Ativas
                </option>

                <option value="inactive">
                  Inativas
                </option>
              </select>

              <label className="low-stock-filter">
                <input
                  type="checkbox"
                  checked={
                    lowStockOnly
                  }
                  onChange={(
                    event,
                  ) =>
                    setLowStockOnly(
                      event.target
                        .checked,
                    )
                  }
                />

                Estoque baixo
              </label>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  void loadVariants();
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
              </button>

              <button
                type="button"
                className="compact-primary-button"
                onClick={
                  openCreateForm
                }
              >
                <Plus size={17} />
                Nova variação
              </button>
            </div>

            <section className="variant-summary-grid">
              <article>
                <PackagePlus
                  size={20}
                />

                <div>
                  <span>
                    Variações
                  </span>

                  <strong>
                    {variants.length}
                  </strong>
                </div>
              </article>

              <article>
                <Boxes size={20} />

                <div>
                  <span>
                    Estoque disponível
                  </span>

                  <strong>
                    {
                      totalAvailableStock
                    }
                  </strong>
                </div>
              </article>

              <article>
                <TriangleAlert
                  size={20}
                />

                <div>
                  <span>
                    Estoque baixo
                  </span>

                  <strong>
                    {lowStockCount}
                  </strong>
                </div>
              </article>
            </section>

            {loading ? (
              <div className="variants-state">
                <LoaderCircle
                  size={28}
                  className="icon-spinning"
                />

                Carregando variações...
              </div>
            ) : filteredVariants
                .length === 0 ? (
              <div className="variants-state">
                <PackagePlus
                  size={32}
                />

                <strong>
                  Nenhuma variação
                  encontrada.
                </strong>

                <span>
                  Crie uma variação ou
                  altere os filtros.
                </span>
              </div>
            ) : (
              <div className="variants-table-wrapper">
                <table className="variants-table">
                  <thead>
                    <tr>
                      <th>Variação</th>
                      <th>Preço</th>
                      <th>Estoque</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVariants.map(
                      (variant) => (
                        <tr
                          key={
                            variant.id
                          }
                        >
                          <td>
                            <strong>
                              {
                                variant.sku
                              }
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
                              {formatMoney(
                                variant.priceInCents,
                              )}
                            </strong>

                            {variant.compareAtPriceInCents !==
                              null && (
                              <del>
                                {formatMoney(
                                  variant.compareAtPriceInCents,
                                )}
                              </del>
                            )}
                          </td>

                          <td>
                            <strong
                              className={
                                variant.isLowStock
                                  ? "variant-low-stock"
                                  : ""
                              }
                            >
                              {
                                variant.availableStock
                              }
                            </strong>

                            <span>
                              Total:{" "}
                              {
                                variant.stock
                              }

                              {variant.reservedStock >
                                0 &&
                                ` · ${variant.reservedStock} reservado`}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                variant.isActive
                                  ? "variant-status active"
                                  : "variant-status inactive"
                              }
                            >
                              {variant.isActive
                                ? "Ativa"
                                : "Inativa"}
                            </span>
                          </td>

                          <td>
                            <div className="variant-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    variant,
                                  )
                                }
                                title="Editar"
                              >
                                <Edit3
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openStockForm(
                                    variant,
                                  )
                                }
                                title="Ajustar estoque"
                              >
                                <Boxes
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  actionVariantId ===
                                  variant.id
                                }
                                onClick={() => {
                                  void toggleStatus(
                                    variant,
                                  );
                                }}
                                title={
                                  variant.isActive
                                    ? "Desativar"
                                    : "Ativar"
                                }
                              >
                                {actionVariantId ===
                                variant.id ? (
                                  <LoaderCircle
                                    size={16}
                                    className="icon-spinning"
                                  />
                                ) : (
                                  <BadgeDollarSign
                                    size={16}
                                  />
                                )}
                              </button>

                              <button
                                type="button"
                                className="variant-delete-button"
                                disabled={
                                  actionVariantId ===
                                  variant.id
                                }
                                onClick={() => {
                                  void deleteVariant(
                                    variant,
                                  );
                                }}
                                title="Excluir"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === "form" && (
          <form
            className="variant-form"
            onSubmit={
              handleSave
            }
          >
            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <section className="variant-form-section">
              <h3>
                Identificação
              </h3>

              <div className="variant-form-grid">
                <label className="variant-form-full">
                  <span>SKU</span>

                  <input
                    value={form.sku}
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          sku:
                            event.target
                              .value
                              .toUpperCase(),
                        }),
                      )
                    }
                    minLength={2}
                    maxLength={100}
                    placeholder="NIKE-AIR-PRETO-40"
                    required
                    autoFocus
                  />
                </label>

                <label>
                  <span>Cor</span>

                  <input
                    value={
                      form.color
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          color:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={80}
                    placeholder="Preto"
                  />
                </label>

                <label>
                  <span>
                    Tamanho
                  </span>

                  <input
                    value={
                      form.size
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          size:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={30}
                    placeholder="40"
                  />
                </label>

                <label className="variant-form-full">
                  <span>
                    Código de barras
                  </span>

                  <input
                    value={
                      form.barcode
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          barcode:
                            event.target
                              .value,
                        }),
                      )
                    }
                    maxLength={100}
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </section>

            <section className="variant-form-section">
              <h3>
                Preços
              </h3>

              <div className="variant-form-grid three-columns">
                <label>
                  <span>
                    Preço atual
                  </span>

                  <input
                    inputMode="decimal"
                    value={
                      form.price
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          price:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="299,90"
                    required
                  />
                </label>

                <label>
                  <span>
                    Preço anterior
                  </span>

                  <input
                    inputMode="decimal"
                    value={
                      form.compareAtPrice
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          compareAtPrice:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="349,90"
                  />
                </label>

                <label>
                  <span>Custo</span>

                  <input
                    inputMode="decimal"
                    value={
                      form.cost
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          cost:
                            event.target
                              .value,
                        }),
                      )
                    }
                    placeholder="150,00"
                  />
                </label>
              </div>
            </section>

            <section className="variant-form-section">
              <h3>
                Estoque
              </h3>

              <div className="variant-form-grid">
                <label>
                  <span>
                    Estoque inicial
                  </span>

                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={
                      form.stock
                    }
                    disabled={
                      Boolean(
                        editingVariant,
                      )
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          stock:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />

                  {editingVariant && (
                    <small>
                      Use “Ajustar estoque”
                      após salvar.
                    </small>
                  )}
                </label>

                <label>
                  <span>
                    Limite de estoque
                    baixo
                  </span>

                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={
                      form.lowStockThreshold
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          lowStockThreshold:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>
            </section>

            <section className="variant-form-section">
              <h3>
                Peso e dimensões
              </h3>

              <div className="variant-form-grid four-columns">
                <label>
                  <span>
                    Peso (g)
                  </span>

                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={
                      form.weightInGrams
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          weightInGrams:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Altura
                  </span>

                  <input
                    inputMode="decimal"
                    value={
                      form.height
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          height:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Largura
                  </span>

                  <input
                    inputMode="decimal"
                    value={
                      form.width
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          width:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Comprimento
                  </span>

                  <input
                    inputMode="decimal"
                    value={
                      form.length
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (current) => ({
                          ...current,

                          length:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>
            </section>

            {!editingVariant && (
              <label className="variant-active-checkbox">
                <input
                  type="checkbox"
                  checked={
                    form.isActive
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (current) => ({
                        ...current,

                        isActive:
                          event.target
                            .checked,
                      }),
                    )
                  }
                />

                Criar variação ativa
              </label>
            )}

            <footer className="variant-form-footer">
              <button
                type="button"
                className="ghost-button"
                onClick={
                  returnToList
                }
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
                ) : editingVariant ? (
                  "Salvar alterações"
                ) : (
                  "Criar variação"
                )}
              </button>
            </footer>
          </form>
        )}

        {view === "stock" &&
          stockVariant && (
          <form
            className="stock-adjustment-form"
            onSubmit={
              handleStockAdjustment
            }
          >
            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <div className="stock-current-card">
              <Boxes size={25} />

              <div>
                <span>
                  Estoque atual
                </span>

                <strong>
                  {
                    stockVariant.stock
                  }
                </strong>

                <small>
                  {
                    stockVariant.availableStock
                  }{" "}
                  disponíveis e{" "}
                  {
                    stockVariant.reservedStock
                  }{" "}
                  reservados
                </small>
              </div>
            </div>

            <label>
              <span>
                Quantidade do ajuste
              </span>

              <input
                type="number"
                step={1}
                value={
                  stockForm.quantity
                }
                onChange={(
                  event,
                ) =>
                  setStockForm(
                    (current) => ({
                      ...current,

                      quantity:
                        event.target
                          .value,
                    }),
                  )
                }
                placeholder="Ex.: 10 ou -2"
                required
                autoFocus
              />

              <small>
                Use um número positivo
                para adicionar e negativo
                para remover.
              </small>
            </label>

            <label>
              <span>
                Motivo
              </span>

              <textarea
                value={
                  stockForm.reason
                }
                onChange={(
                  event,
                ) =>
                  setStockForm(
                    (current) => ({
                      ...current,

                      reason:
                        event.target
                          .value,
                    }),
                  )
                }
                maxLength={300}
                rows={4}
                placeholder="Ex.: Entrada de mercadoria"
              />
            </label>

            <footer className="variant-form-footer">
              <button
                type="button"
                className="ghost-button"
                onClick={
                  returnToList
                }
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

                    Ajustando...
                  </>
                ) : (
                  "Confirmar ajuste"
                )}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}