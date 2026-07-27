import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Copy,
  Edit3,
  Gift,
  LoaderCircle,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  TicketPercent,
  ToggleLeft,
  ToggleRight,
  Truck,
  Users,
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
  Coupon,
  CouponResponse,
  CouponsResponse,
  CouponType,
} from "../types/coupons";

import type {
  Pagination,
} from "../types/orders";

type CouponState =
  | "ACTIVE"
  | "INACTIVE"
  | "SCHEDULED"
  | "EXPIRED"
  | "LIMIT_REACHED";

interface CouponFilters {
  search: string;

  type:
    | CouponType
    | "";

  active:
    | ""
    | "true"
    | "false";

  sortOrder:
    | "asc"
    | "desc";
}

interface CouponForm {
  code: string;
  description: string;

  type: CouponType;
  value: string;

  minimumOrder: string;
  maximumDiscount: string;

  usageLimit: string;
  usageLimitPerUser: string;

  startsAt: string;
  expiresAt: string;

  active: boolean;
}

const initialFilters:
  CouponFilters = {
    search: "",
    type: "",
    active: "",
    sortOrder: "desc",
  };

const initialForm:
  CouponForm = {
    code: "",
    description: "",

    type: "PERCENTAGE",
    value: "",

    minimumOrder: "",
    maximumDiscount: "",

    usageLimit: "",
    usageLimitPerUser: "",

    startsAt: "",
    expiresAt: "",

    active: true,
  };

const emptyPagination:
  Pagination = {
    page: 1,
    limit: 20,

    totalItems: 0,
    totalPages: 0,

    hasNextPage: false,
    hasPreviousPage: false,
  };

const couponTypes:
  CouponType[] = [
    "PERCENTAGE",
    "FIXED",
    "FREE_SHIPPING",
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
  ).format(
    valueInCents / 100,
  );
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Sem data definida";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

function formatCouponType(
  type: CouponType,
) {
  const labels: Record<
    CouponType,
    string
  > = {
    PERCENTAGE:
      "Desconto percentual",

    FIXED:
      "Desconto fixo",

    FREE_SHIPPING:
      "Frete grátis",
  };

  return labels[type];
}

function formatCouponValue(
  coupon: Coupon,
) {
  if (
    coupon.type ===
    "PERCENTAGE"
  ) {
    return `${coupon.value}%`;
  }

  if (
    coupon.type ===
    "FIXED"
  ) {
    return formatMoney(
      coupon.value,
    );
  }

  return "Frete grátis";
}

function getCouponState(
  coupon: Coupon,
): CouponState {
  if (!coupon.active) {
    return "INACTIVE";
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageCount >=
      coupon.usageLimit
  ) {
    return "LIMIT_REACHED";
  }

  const now = new Date();

  if (
    coupon.startsAt &&
    new Date(
      coupon.startsAt,
    ) > now
  ) {
    return "SCHEDULED";
  }

  if (
    coupon.expiresAt &&
    new Date(
      coupon.expiresAt,
    ) < now
  ) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

function formatCouponState(
  state: CouponState,
) {
  const labels: Record<
    CouponState,
    string
  > = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    SCHEDULED: "Agendado",
    EXPIRED: "Expirado",
    LIMIT_REACHED:
      "Limite atingido",
  };

  return labels[state];
}

function moneyToInput(
  valueInCents:
    | number
    | null,
) {
  if (
    valueInCents === null
  ) {
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

  const normalized =
    trimmed
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

  const number =
    Number(normalized);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return Math.round(
    number * 100,
  );
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
    number < 1
  ) {
    return null;
  }

  return number;
}

function toDateTimeLocal(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const localDate =
    new Date(
      date.getTime() -
        date.getTimezoneOffset() *
          60_000,
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function toISOStringOrNull(
  value: string,
) {
  if (!value) {
    return null;
  }

  return new Date(
    value,
  ).toISOString();
}

export function CouponsPage() {
  const [coupons, setCoupons] =
    useState<Coupon[]>([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      emptyPagination,
    );

  const [page, setPage] =
    useState(1);

  const [
    draftFilters,
    setDraftFilters,
  ] =
    useState<CouponFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<CouponFilters>(
      initialFilters,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingCoupon,
    setEditingCoupon,
  ] =
    useState<Coupon | null>(
      null,
    );

  const [form, setForm] =
    useState<CouponForm>(
      initialForm,
    );

  const [
    formError,
    setFormError,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    changingStatusId,
    setChangingStatusId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    copiedCouponId,
    setCopiedCouponId,
  ] =
    useState<string | null>(
      null,
    );

  const loadCoupons =
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
        "sortOrder",
        filters.sortOrder,
      );

      if (filters.search) {
        query.set(
          "search",
          filters.search,
        );
      }

      if (filters.type) {
        query.set(
          "type",
          filters.type,
        );
      }

      if (filters.active) {
        query.set(
          "active",
          filters.active,
        );
      }

      try {
        const response =
          await apiRequest<
            CouponsResponse
          >(
            `/admin/coupons/?${query.toString()}`,
          );

        setCoupons(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setCoupons([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar os cupons.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      filters,
      page,
    ]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadCoupons();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadCoupons]);

  const summary =
    useMemo(() => {
      const states =
        coupons.map(
          getCouponState,
        );

      return {
        active:
          states.filter(
            (state) =>
              state === "ACTIVE",
          ).length,

        scheduled:
          states.filter(
            (state) =>
              state ===
              "SCHEDULED",
          ).length,

        unavailable:
          states.filter(
            (state) =>
              state ===
                "EXPIRED" ||
              state ===
                "LIMIT_REACHED" ||
              state ===
                "INACTIVE",
          ).length,

        uses:
          coupons.reduce(
            (
              total,
              coupon,
            ) =>
              total +
              coupon.usageCount,
            0,
          ),
      };
    }, [coupons]);

  function applyFilters(
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
    setEditingCoupon(null);

    setForm(
      initialForm,
    );

    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    coupon: Coupon,
  ) {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code,

      description:
        coupon.description ?? "",

      type: coupon.type,

      value:
        coupon.type ===
        "FIXED"
          ? moneyToInput(
              coupon.value,
            )
          : coupon.type ===
              "PERCENTAGE"
            ? String(
                coupon.value,
              )
            : "0",

      minimumOrder:
        moneyToInput(
          coupon
            .minimumOrderInCents,
        ),

      maximumDiscount:
        moneyToInput(
          coupon
            .maximumDiscountInCents,
        ),

      usageLimit:
        coupon.usageLimit !==
        null
          ? String(
              coupon.usageLimit,
            )
          : "",

      usageLimitPerUser:
        coupon
          .usageLimitPerUser !==
        null
          ? String(
              coupon
                .usageLimitPerUser,
            )
          : "",

      startsAt:
        toDateTimeLocal(
          coupon.startsAt,
        ),

      expiresAt:
        toDateTimeLocal(
          coupon.expiresAt,
        ),

      active: coupon.active,
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCoupon(null);
    setForm(initialForm);
    setFormError("");
  }

  async function copyCoupon(
    coupon: Coupon,
  ) {
    try {
      await navigator.clipboard
        .writeText(
          coupon.code,
        );

      setCopiedCouponId(
        coupon.id,
      );

      window.setTimeout(() => {
        setCopiedCouponId(
          null,
        );
      }, 1500);
    } catch {
      setError(
        "Não foi possível copiar o código.",
      );
    }
  }

  function validateForm() {
    const code =
      form.code
        .trim()
        .toUpperCase();

    if (
      !/^[A-Z0-9_-]{3,30}$/.test(
        code,
      )
    ) {
      setFormError(
        "O código deve possuir de 3 a 30 caracteres e aceitar apenas letras, números, hífen e underline.",
      );

      return null;
    }

    const description =
      form.description.trim();

    if (
      description &&
      description.length < 3
    ) {
      setFormError(
        "A descrição deve possuir pelo menos 3 caracteres.",
      );

      return null;
    }

    let value = 0;

    if (
      form.type ===
      "PERCENTAGE"
    ) {
      value =
        Number(form.value);

      if (
        !Number.isInteger(
          value,
        ) ||
        value < 1 ||
        value > 100
      ) {
        setFormError(
          "O percentual deve estar entre 1 e 100.",
        );

        return null;
      }
    }

    if (
      form.type === "FIXED"
    ) {
      const fixedValue =
        moneyInputToCents(
          form.value,
        );

      if (
        fixedValue === null ||
        fixedValue < 1
      ) {
        setFormError(
          "Informe um valor de desconto válido.",
        );

        return null;
      }

      value = fixedValue;
    }

    const minimumOrderInCents =
      form.minimumOrder.trim()
        ? moneyInputToCents(
            form.minimumOrder,
          )
        : 0;

    if (
      minimumOrderInCents ===
      null
    ) {
      setFormError(
        "Informe um valor mínimo de pedido válido.",
      );

      return null;
    }

    let maximumDiscountInCents:
      | number
      | null = null;

    if (
      form.type ===
        "PERCENTAGE" &&
      form.maximumDiscount.trim()
    ) {
      maximumDiscountInCents =
        moneyInputToCents(
          form.maximumDiscount,
        );

      if (
        maximumDiscountInCents ===
          null ||
        maximumDiscountInCents <
          1
      ) {
        setFormError(
          "Informe um desconto máximo válido.",
        );

        return null;
      }
    }

    const usageLimit =
      form.usageLimit.trim()
        ? optionalInteger(
            form.usageLimit,
          )
        : null;

    if (
      form.usageLimit.trim() &&
      usageLimit === null
    ) {
      setFormError(
        "O limite total deve ser um número inteiro maior que zero.",
      );

      return null;
    }

    const usageLimitPerUser =
      form
        .usageLimitPerUser
        .trim()
        ? optionalInteger(
            form
              .usageLimitPerUser,
          )
        : null;

    if (
      form
        .usageLimitPerUser
        .trim() &&
      usageLimitPerUser ===
        null
    ) {
      setFormError(
        "O limite por cliente deve ser um número inteiro maior que zero.",
      );

      return null;
    }

    const startsAt =
      toISOStringOrNull(
        form.startsAt,
      );

    const expiresAt =
      toISOStringOrNull(
        form.expiresAt,
      );

    if (
      startsAt &&
      expiresAt &&
      new Date(startsAt) >=
        new Date(expiresAt)
    ) {
      setFormError(
        "A expiração deve ser posterior ao início.",
      );

      return null;
    }

    return {
      code,
      description,
      value,

      minimumOrderInCents,
      maximumDiscountInCents,

      usageLimit,
      usageLimitPerUser,

      startsAt,
      expiresAt,
    };
  }

  async function handleSave(
    event: FormEvent,
  ) {
    event.preventDefault();

    const validated =
      validateForm();

    if (!validated) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingCoupon) {
        await apiRequest<
          CouponResponse
        >(
          `/admin/coupons/${editingCoupon.id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              code:
                validated.code,

              description:
                validated
                  .description ||
                null,

              type: form.type,

              value:
                validated.value,

              minimumOrderInCents:
                validated
                  .minimumOrderInCents,

              maximumDiscountInCents:
                validated
                  .maximumDiscountInCents,

              usageLimit:
                validated
                  .usageLimit,

              usageLimitPerUser:
                validated
                  .usageLimitPerUser,

              startsAt:
                validated.startsAt,

              expiresAt:
                validated.expiresAt,

              active:
                form.active,
            }),
          },
        );

        setSuccessMessage(
          "Cupom atualizado com sucesso.",
        );
      } else {
        const body: {
          code: string;
          description?: string;

          type: CouponType;
          value: number;

          minimumOrderInCents:
            number;

          maximumDiscountInCents?:
            number;

          usageLimit?: number;

          usageLimitPerUser?:
            number;

          startsAt?: string;
          expiresAt?: string;

          active: boolean;
        } = {
          code:
            validated.code,

          type: form.type,

          value:
            validated.value,

          minimumOrderInCents:
            validated
              .minimumOrderInCents,

          active:
            form.active,
        };

        if (
          validated.description
        ) {
          body.description =
            validated.description;
        }

        if (
          validated
            .maximumDiscountInCents !==
          null
        ) {
          body.maximumDiscountInCents =
            validated
              .maximumDiscountInCents;
        }

        if (
          validated.usageLimit !==
          null
        ) {
          body.usageLimit =
            validated.usageLimit;
        }

        if (
          validated
            .usageLimitPerUser !==
          null
        ) {
          body.usageLimitPerUser =
            validated
              .usageLimitPerUser;
        }

        if (validated.startsAt) {
          body.startsAt =
            validated.startsAt;
        }

        if (validated.expiresAt) {
          body.expiresAt =
            validated.expiresAt;
        }

        await apiRequest<
          CouponResponse
        >(
          "/admin/coupons/",
          {
            method: "POST",

            body: JSON.stringify(
              body,
            ),
          },
        );

        setSuccessMessage(
          "Cupom criado com sucesso.",
        );
      }

      setModalOpen(false);
      setEditingCoupon(null);
      setForm(initialForm);

      await loadCoupons();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível salvar o cupom.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    coupon: Coupon,
  ) {
    setChangingStatusId(
      coupon.id,
    );

    setError("");

    try {
      const response =
        await apiRequest<
          CouponResponse
        >(
          `/admin/coupons/${coupon.id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              active:
                !coupon.active,
            }),
          },
        );

      setCoupons(
        (currentCoupons) =>
          currentCoupons.map(
            (currentCoupon) =>
              currentCoupon.id ===
              coupon.id
                ? response.data
                    .coupon
                : currentCoupon,
          ),
      );

      setSuccessMessage(
        coupon.active
          ? "Cupom desativado."
          : "Cupom ativado.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível alterar o status.",
      );
    } finally {
      setChangingStatusId(null);
    }
  }

  return (
    <div className="coupons-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            PROMOÇÕES
          </span>

          <h1>Cupons</h1>

          <p>
            Gerencie descontos,
            limites e períodos de
            validade.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void loadCoupons();
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
            Novo cupom
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

      <section className="coupon-summary-grid">
        <article>
          <TicketPercent
            size={21}
          />

          <div>
            <span>
              Total cadastrado
            </span>

            <strong>
              {
                pagination.totalItems
              }
            </strong>
          </div>
        </article>

        <article>
          <ToggleRight
            size={21}
          />

          <div>
            <span>
              Ativos nesta página
            </span>

            <strong>
              {summary.active}
            </strong>
          </div>
        </article>

        <article>
          <CalendarClock
            size={21}
          />

          <div>
            <span>
              Agendados nesta página
            </span>

            <strong>
              {summary.scheduled}
            </strong>
          </div>
        </article>

        <article>
          <CircleOff
            size={21}
          />

          <div>
            <span>
              Indisponíveis nesta página
            </span>

            <strong>
              {summary.unavailable}
            </strong>
          </div>
        </article>

        <article>
          <Users size={21} />

          <div>
            <span>
              Usos nesta página
            </span>

            <strong>
              {summary.uses}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="coupons-filter-panel"
        onSubmit={applyFilters}
      >
        <div className="coupon-search">
          <Search size={17} />

          <input
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
            placeholder="Código ou descrição"
          />
        </div>

        <select
          value={
            draftFilters.type
          }
          onChange={(event) =>
            setDraftFilters(
              (current) => ({
                ...current,

                type:
                  event.target
                    .value as
                    | CouponType
                    | "",
              }),
            )
          }
        >
          <option value="">
            Todos os tipos
          </option>

          {couponTypes.map(
            (type) => (
              <option
                value={type}
                key={type}
              >
                {formatCouponType(
                  type,
                )}
              </option>
            ),
          )}
        </select>

        <select
          value={
            draftFilters.active
          }
          onChange={(event) =>
            setDraftFilters(
              (current) => ({
                ...current,

                active:
                  event.target
                    .value as
                    CouponFilters["active"],
              }),
            )
          }
        >
          <option value="">
            Todos os status
          </option>

          <option value="true">
            Habilitados
          </option>

          <option value="false">
            Desabilitados
          </option>
        </select>

        <select
          value={
            draftFilters.sortOrder
          }
          onChange={(event) =>
            setDraftFilters(
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
            Mais antigos
          </option>
        </select>

        <div className="coupon-filter-actions">
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

      <section className="coupons-panel">
        {loading ? (
          <div className="coupons-state">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            Carregando cupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="coupons-state">
            <Gift size={35} />

            <strong>
              Nenhum cupom
              encontrado.
            </strong>

            <span>
              Crie um cupom ou
              altere os filtros.
            </span>
          </div>
        ) : (
          <div className="coupon-grid">
            {coupons.map(
              (coupon) => {
                const state =
                  getCouponState(
                    coupon,
                  );

                const usagePercentage =
                  coupon.usageLimit !==
                  null
                    ? Math.min(
                        100,
                        Math.round(
                          coupon.usageCount /
                            coupon.usageLimit *
                            100,
                        ),
                      )
                    : 0;

                return (
                  <article
                    className="coupon-card"
                    key={coupon.id}
                  >
                    <header className="coupon-card-header">
                      <div className="coupon-code">
                        <Tag
                          size={17}
                        />

                        <strong>
                          {coupon.code}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="coupon-copy-button"
                        onClick={() => {
                          void copyCoupon(
                            coupon,
                          );
                        }}
                        title="Copiar código"
                      >
                        {copiedCouponId ===
                        coupon.id ? (
                          <Check
                            size={16}
                          />
                        ) : (
                          <Copy
                            size={16}
                          />
                        )}
                      </button>
                    </header>

                    <div className="coupon-card-body">
                      <span
                        className={`coupon-state coupon-state-${state.toLowerCase().replace("_", "-")}`}
                      >
                        {formatCouponState(
                          state,
                        )}
                      </span>

                      <div className="coupon-value">
                        {coupon.type ===
                        "FREE_SHIPPING" ? (
                          <Truck
                            size={24}
                          />
                        ) : (
                          <Percent
                            size={24}
                          />
                        )}

                        <strong>
                          {formatCouponValue(
                            coupon,
                          )}
                        </strong>
                      </div>

                      <span className="coupon-type-label">
                        {formatCouponType(
                          coupon.type,
                        )}
                      </span>

                      <p>
                        {coupon.description ??
                          "Nenhuma descrição informada."}
                      </p>

                      <div className="coupon-rules-grid">
                        <div>
                          <span>
                            Pedido mínimo
                          </span>

                          <strong>
                            {coupon.minimumOrderInCents >
                            0
                              ? formatMoney(
                                  coupon.minimumOrderInCents,
                                )
                              : "Sem mínimo"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Máximo por cliente
                          </span>

                          <strong>
                            {coupon.usageLimitPerUser ??
                              "Ilimitado"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Início
                          </span>

                          <strong>
                            {coupon.startsAt
                              ? formatDate(
                                  coupon.startsAt,
                                )
                              : "Imediato"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Expiração
                          </span>

                          <strong>
                            {coupon.expiresAt
                              ? formatDate(
                                  coupon.expiresAt,
                                )
                              : "Sem expiração"}
                          </strong>
                        </div>
                      </div>

                      <div className="coupon-usage">
                        <div>
                          <span>
                            Utilizações
                          </span>

                          <strong>
                            {coupon.usageCount}

                            {coupon.usageLimit !==
                              null &&
                              ` / ${coupon.usageLimit}`}
                          </strong>
                        </div>

                        {coupon.usageLimit !==
                          null && (
                          <div className="coupon-progress">
                            <span
                              style={{
                                width:
                                  `${usagePercentage}%`,
                              }}
                            />
                          </div>
                        )}

                        <small>
                          {
                            coupon._count
                              .orders
                          }{" "}
                          pedidos vinculados
                        </small>
                      </div>
                    </div>

                    <footer className="coupon-card-footer">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            coupon,
                          )
                        }
                      >
                        <Edit3
                          size={16}
                        />

                        Editar
                      </button>

                      <button
                        type="button"
                        className={
                          coupon.active
                            ? "coupon-status-button active"
                            : "coupon-status-button"
                        }
                        disabled={
                          changingStatusId ===
                          coupon.id
                        }
                        onClick={() => {
                          void toggleStatus(
                            coupon,
                          );
                        }}
                      >
                        {changingStatusId ===
                        coupon.id ? (
                          <LoaderCircle
                            size={16}
                            className="icon-spinning"
                          />
                        ) : coupon.active ? (
                          <ToggleRight
                            size={17}
                          />
                        ) : (
                          <ToggleLeft
                            size={17}
                          />
                        )}

                        {coupon.active
                          ? "Desativar"
                          : "Ativar"}
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
                    !pagination
                      .hasPreviousPage
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
                    !pagination
                      .hasNextPage
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
            className="coupon-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="category-modal-header">
              <div>
                <span className="eyebrow">
                  {editingCoupon
                    ? "EDIÇÃO"
                    : "CADASTRO"}
                </span>

                <h2>
                  {editingCoupon
                    ? "Editar cupom"
                    : "Novo cupom"}
                </h2>

                {editingCoupon && (
                  <p>
                    {
                      editingCoupon.code
                    }
                  </p>
                )}
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
              className="coupon-form"
              onSubmit={handleSave}
            >
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}

              {editingCoupon && (
                <section className="coupon-edit-summary">
                  <div>
                    <span>
                      Usos registrados
                    </span>

                    <strong>
                      {
                        editingCoupon.usageCount
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pedidos vinculados
                    </span>

                    <strong>
                      {
                        editingCoupon
                          ._count.orders
                      }
                    </strong>
                  </div>
                </section>
              )}

              <section className="coupon-form-section">
                <h3>
                  Identificação
                </h3>

                <div className="coupon-form-grid">
                  <label>
                    <span>
                      Código
                    </span>

                    <input
                      value={
                        form.code
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            code:
                              event.target
                                .value
                                .toUpperCase(),
                          }),
                        )
                      }
                      minLength={3}
                      maxLength={30}
                      placeholder="LS10"
                      required
                      autoFocus
                    />
                  </label>

                  <label>
                    <span>
                      Tipo
                    </span>

                    <select
                      value={
                        form.type
                      }
                      onChange={(
                        event,
                      ) => {
                        const type =
                          event.target
                            .value as
                            CouponType;

                        setForm(
                          (current) => ({
                            ...current,

                            type,

                            value:
                              type ===
                              "FREE_SHIPPING"
                                ? "0"
                                : "",

                            maximumDiscount:
                              type ===
                              "PERCENTAGE"
                                ? current
                                    .maximumDiscount
                                : "",
                          }),
                        );
                      }}
                    >
                      {couponTypes.map(
                        (type) => (
                          <option
                            value={
                              type
                            }
                            key={type}
                          >
                            {formatCouponType(
                              type,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="coupon-form-full">
                    <span>
                      Descrição
                    </span>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            description:
                              event.target
                                .value,
                          }),
                        )
                      }
                      maxLength={300}
                      rows={3}
                      placeholder="Ex.: 10% de desconto na primeira compra"
                    />

                    <small>
                      {
                        form.description
                          .length
                      }
                      /300
                    </small>
                  </label>
                </div>
              </section>

              <section className="coupon-form-section">
                <h3>
                  Regra de desconto
                </h3>

                <div className="coupon-form-grid">
                  <label>
                    <span>
                      {form.type ===
                      "PERCENTAGE"
                        ? "Percentual"
                        : form.type ===
                            "FIXED"
                          ? "Valor do desconto"
                          : "Valor"}
                    </span>

                    <input
                      type={
                        form.type ===
                        "PERCENTAGE"
                          ? "number"
                          : "text"
                      }
                      min={
                        form.type ===
                        "PERCENTAGE"
                          ? 1
                          : undefined
                      }
                      max={
                        form.type ===
                        "PERCENTAGE"
                          ? 100
                          : undefined
                      }
                      step={
                        form.type ===
                        "PERCENTAGE"
                          ? 1
                          : undefined
                      }
                      inputMode={
                        form.type ===
                        "FIXED"
                          ? "decimal"
                          : undefined
                      }
                      value={
                        form.value
                      }
                      disabled={
                        form.type ===
                        "FREE_SHIPPING"
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            value:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder={
                        form.type ===
                        "PERCENTAGE"
                          ? "10"
                          : form.type ===
                              "FIXED"
                            ? "25,00"
                            : "0"
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>
                      Pedido mínimo
                    </span>

                    <input
                      inputMode="decimal"
                      value={
                        form.minimumOrder
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            minimumOrder:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Ex.: 100,00"
                    />
                  </label>

                  <label className="coupon-form-full">
                    <span>
                      Desconto máximo
                    </span>

                    <input
                      inputMode="decimal"
                      value={
                        form.maximumDiscount
                      }
                      disabled={
                        form.type !==
                        "PERCENTAGE"
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            maximumDiscount:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder={
                        form.type ===
                        "PERCENTAGE"
                          ? "Ex.: 50,00"
                          : "Disponível somente para percentual"
                      }
                    />

                    <small>
                      Limita o valor máximo
                      concedido por um
                      desconto percentual.
                    </small>
                  </label>
                </div>
              </section>

              <section className="coupon-form-section">
                <h3>
                  Limites de utilização
                </h3>

                <div className="coupon-form-grid">
                  <label>
                    <span>
                      Limite total
                    </span>

                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={
                        form.usageLimit
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            usageLimit:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Ilimitado"
                    />
                  </label>

                  <label>
                    <span>
                      Limite por cliente
                    </span>

                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={
                        form.usageLimitPerUser
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            usageLimitPerUser:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="Ilimitado"
                    />
                  </label>
                </div>
              </section>

              <section className="coupon-form-section">
                <h3>
                  Período de validade
                </h3>

                <div className="coupon-form-grid">
                  <label>
                    <span>
                      Início
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.startsAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            startsAt:
                              event.target
                                .value,
                          }),
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Expiração
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.expiresAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            expiresAt:
                              event.target
                                .value,
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <label className="coupon-active-checkbox">
                <input
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm(
                      (current) => ({
                        ...current,

                        active:
                          event.target
                            .checked,
                      }),
                    )
                  }
                />

                <div>
                  <strong>
                    Cupom habilitado
                  </strong>

                  <span>
                    O período, os limites e
                    o pedido mínimo também
                    serão verificados no
                    checkout.
                  </span>
                </div>
              </label>

              <footer className="variant-form-footer">
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
                  ) : editingCoupon ? (
                    "Salvar alterações"
                  ) : (
                    "Criar cupom"
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