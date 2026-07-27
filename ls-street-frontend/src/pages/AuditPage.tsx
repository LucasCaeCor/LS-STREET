import {
  Activity,
  Boxes,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  CreditCard,
  Eye,
  Globe2,
  LoaderCircle,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
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
  AuditAction,
  AuditLog,
  AuditLogResponse,
  AuditLogsResponse,
  AuditSummary,
  AuditSummaryResponse,
} from "../types/audit";

import type {
  Pagination,
} from "../types/orders";

interface AuditFilters {
  search: string;

  action:
    | AuditAction
    | "";

  entity: string;
  userPublicId: string;

  startDate: string;
  endDate: string;

  sortOrder:
    | "asc"
    | "desc";
}

const initialFilters:
  AuditFilters = {
    search: "",
    action: "",

    entity: "",
    userPublicId: "",

    startDate: "",
    endDate: "",

    sortOrder: "desc",
  };

const emptySummary:
  AuditSummary = {
    total: 0,
    today: 0,
    byAction: {},
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

const auditActions:
  AuditAction[] = [
    "CREATE",
    "UPDATE",
    "DELETE",

    "STATUS_CHANGE",

    "LOGIN",
    "LOGOUT",

    "PAYMENT_UPDATE",
    "STOCK_UPDATE",
  ];

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "medium",
    },
  ).format(
    new Date(value),
  );
}

function formatAction(
  action: AuditAction,
) {
  const labels: Record<
    AuditAction,
    string
  > = {
    CREATE: "Criação",
    UPDATE: "Atualização",
    DELETE: "Exclusão",

    STATUS_CHANGE:
      "Mudança de status",

    LOGIN: "Login",
    LOGOUT: "Logout",

    PAYMENT_UPDATE:
      "Atualização de pagamento",

    STOCK_UPDATE:
      "Atualização de estoque",
  };

  return labels[action];
}

function formatEntity(
  entity: string,
) {
  const normalized =
    entity
      .toLowerCase()
      .replace(/^:/, "")
      .replace(
        /[-_]/g,
        " ",
      );

  const labels: Record<
    string,
    string
  > = {
    products: "Produtos",
    product: "Produto",

    categories:
      "Categorias",

    banners: "Banners",
    coupons: "Cupons",

    orders: "Pedidos",
    payments: "Pagamentos",

    inventory: "Estoque",

    users: "Usuários",
    customers: "Clientes",

    favorites: "Favoritos",

    id: "Registro",
  };

  return (
    labels[normalized] ??
    normalized
      .split(" ")
      .map(
        (word) =>
          word
            .slice(0, 1)
            .toUpperCase() +
          word.slice(1),
      )
      .join(" ")
  );
}

function getActionClass(
  action: AuditAction,
) {
  return action
    .toLowerCase()
    .replaceAll("_", "-");
}

function formatJson(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "Nenhum dado registrado.";
  }

  try {
    const serialized =
      JSON.stringify(
        value,
        null,
        2,
      );

    return (
      serialized ??
      String(value)
    );
  } catch {
    return String(value);
  }
}

function renderActionIcon(
  action: AuditAction,
) {
  switch (action) {
    case "CREATE":
      return <Plus size={17} />;

    case "UPDATE":
      return (
        <Pencil size={17} />
      );

    case "DELETE":
      return (
        <Trash2 size={17} />
      );

    case "STATUS_CHANGE":
      return <Power size={17} />;

    case "LOGIN":
      return <LogIn size={17} />;

    case "LOGOUT":
      return <LogOut size={17} />;

    case "PAYMENT_UPDATE":
      return (
        <CreditCard size={17} />
      );

    case "STOCK_UPDATE":
      return <Boxes size={17} />;

    default:
      return (
        <Activity size={17} />
      );
  }
}

function shortenText(
  value: string,
  maximumLength: number,
) {
  if (
    value.length <=
    maximumLength
  ) {
    return value;
  }

  return `${value.slice(
    0,
    maximumLength,
  )}...`;
}

export function AuditPage() {
  const [
    auditLogs,
    setAuditLogs,
  ] = useState<
    AuditLog[]
  >([]);

  const [
    summary,
    setSummary,
  ] =
    useState<AuditSummary>(
      emptySummary,
    );

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
    useState<AuditFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<AuditFilters>(
      initialFilters,
    );

  const [
    loadingLogs,
    setLoadingLogs,
  ] = useState(true);

  const [
    loadingSummary,
    setLoadingSummary,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedAudit,
    setSelectedAudit,
  ] =
    useState<AuditLog | null>(
      null,
    );

  const [
    loadingDetails,
    setLoadingDetails,
  ] = useState(false);

  const [
    detailsError,
    setDetailsError,
  ] = useState("");

  const loadSummary =
    useCallback(async () => {
      setLoadingSummary(true);

      try {
        const response =
          await apiRequest<
            AuditSummaryResponse
          >(
            "/admin/audit/summary",
          );

        setSummary(
          response.data.summary,
        );
      } catch (caughtError) {
        setSummary(emptySummary);

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar o resumo da auditoria.",
        );
      } finally {
        setLoadingSummary(false);
      }
    }, []);

  const loadAuditLogs =
    useCallback(async () => {
      setLoadingLogs(true);
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

      if (filters.action) {
        query.set(
          "action",
          filters.action,
        );
      }

      if (filters.entity) {
        query.set(
          "entity",
          filters.entity,
        );
      }

      if (
        filters.userPublicId
      ) {
        query.set(
          "userPublicId",
          filters.userPublicId,
        );
      }

      if (filters.startDate) {
        query.set(
          "startDate",
          filters.startDate,
        );
      }

      if (filters.endDate) {
        query.set(
          "endDate",
          filters.endDate,
        );
      }

      try {
        const response =
          await apiRequest<
            AuditLogsResponse
          >(
            `/admin/audit/?${query.toString()}`,
          );

        setAuditLogs(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setAuditLogs([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar os registros de auditoria.",
        );
      } finally {
        setLoadingLogs(false);
      }
    }, [
      filters,
      page,
    ]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadSummary();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadSummary]);

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        void loadAuditLogs();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadAuditLogs]);

  const updateCount =
    useMemo(
      () =>
        (
          summary.byAction
            .UPDATE ?? 0
        ) +
        (
          summary.byAction
            .STATUS_CHANGE ?? 0
        ) +
        (
          summary.byAction
            .PAYMENT_UPDATE ??
          0
        ) +
        (
          summary.byAction
            .STOCK_UPDATE ?? 0
        ),
      [summary],
    );

  const criticalCount =
    useMemo(
      () =>
        (
          summary.byAction
            .DELETE ?? 0
        ) +
        (
          summary.byAction
            .PAYMENT_UPDATE ??
          0
        ) +
        (
          summary.byAction
            .STOCK_UPDATE ?? 0
        ),
      [summary],
    );

  function applyFilters(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      draftFilters.startDate &&
      draftFilters.endDate &&
      draftFilters.startDate >
        draftFilters.endDate
    ) {
      setError(
        "A data inicial não pode ser posterior à data final.",
      );

      return;
    }

    setPage(1);
    setError("");

    setFilters({
      ...draftFilters,

      search:
        draftFilters.search.trim(),

      entity:
        draftFilters.entity.trim(),

      userPublicId:
        draftFilters
          .userPublicId
          .trim(),
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
    setError("");
  }

  async function reloadAll() {
    await Promise.all([
      loadSummary(),
      loadAuditLogs(),
    ]);
  }

  async function openDetails(
    auditLog: AuditLog,
  ) {
    setSelectedAudit(
      auditLog,
    );

    setLoadingDetails(true);
    setDetailsError("");

    try {
      const response =
        await apiRequest<
          AuditLogResponse
        >(
          `/admin/audit/${auditLog.id}`,
        );

      setSelectedAudit(
        response.data.auditLog,
      );
    } catch (caughtError) {
      setDetailsError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível carregar os detalhes do registro.",
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetails() {
    setSelectedAudit(null);
    setDetailsError("");
  }

  return (
    <div className="audit-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            SEGURANÇA
          </span>

          <h1>Auditoria</h1>

          <p>
            Acompanhe as ações
            realizadas no painel
            administrativo.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            void reloadAll();
          }}
          disabled={
            loadingLogs ||
            loadingSummary
          }
        >
          <RefreshCw
            size={17}
            className={
              loadingLogs ||
              loadingSummary
                ? "icon-spinning"
                : ""
            }
          />

          Atualizar
        </button>
      </header>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <section className="audit-summary-grid">
        <article>
          <ShieldCheck
            size={21}
          />

          <div>
            <span>
              Total de registros
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.total}
            </strong>
          </div>
        </article>

        <article>
          <CalendarDays
            size={21}
          />

          <div>
            <span>
              Ações realizadas hoje
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : summary.today}
            </strong>
          </div>
        </article>

        <article>
          <Plus size={21} />

          <div>
            <span>Criações</span>

            <strong>
              {loadingSummary
                ? "..."
                : summary
                    .byAction
                    .CREATE ?? 0}
            </strong>
          </div>
        </article>

        <article>
          <Pencil size={21} />

          <div>
            <span>
              Atualizações
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : updateCount}
            </strong>
          </div>
        </article>

        <article
          className={
            criticalCount > 0
              ? "audit-critical-card"
              : ""
          }
        >
          <Activity size={21} />

          <div>
            <span>
              Ações sensíveis
            </span>

            <strong>
              {loadingSummary
                ? "..."
                : criticalCount}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="audit-filter-panel"
        onSubmit={applyFilters}
      >
        <div className="audit-search-field">
          <label htmlFor="audit-search">
            Buscar
          </label>

          <div className="audit-search-input">
            <Search size={17} />

            <input
              id="audit-search"
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
              placeholder="Entidade, descrição, usuário ou e-mail"
            />
          </div>
        </div>

        <label>
          <span>Ação</span>

          <select
            value={
              draftFilters.action
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  action:
                    event.target
                      .value as
                      | AuditAction
                      | "",
                }),
              )
            }
          >
            <option value="">
              Todas
            </option>

            {auditActions.map(
              (action) => (
                <option
                  value={action}
                  key={action}
                >
                  {formatAction(
                    action,
                  )}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>Entidade</span>

          <input
            value={
              draftFilters.entity
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  entity:
                    event.target
                      .value,
                }),
              )
            }
            placeholder="Ex.: banners"
          />
        </label>

        <label>
          <span>
            ID do administrador
          </span>

          <input
            value={
              draftFilters.userPublicId
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  userPublicId:
                    event.target
                      .value,
                }),
              )
            }
            placeholder="Public ID"
          />
        </label>

        <label>
          <span>Data inicial</span>

          <input
            type="date"
            value={
              draftFilters.startDate
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  startDate:
                    event.target
                      .value,
                }),
              )
            }
          />
        </label>

        <label>
          <span>Data final</span>

          <input
            type="date"
            value={
              draftFilters.endDate
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  endDate:
                    event.target
                      .value,
                }),
              )
            }
          />
        </label>

        <label>
          <span>Ordenação</span>

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
        </label>

        <div className="audit-filter-actions">
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

      <section className="audit-panel">
        {loadingLogs ? (
          <div className="audit-state">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            Carregando auditoria...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="audit-state">
            <ShieldCheck
              size={35}
            />

            <strong>
              Nenhum registro
              encontrado.
            </strong>

            <span>
              Altere os filtros ou
              realize uma nova ação
              administrativa.
            </span>
          </div>
        ) : (
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Entidade</th>
                  <th>Administrador</th>
                  <th>Descrição</th>
                  <th>Origem</th>
                  <th>Data</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {auditLogs.map(
                  (auditLog) => (
                    <tr
                      key={auditLog.id}
                    >
                      <td>
                        <span
                          className={`audit-action audit-action-${getActionClass(
                            auditLog.action,
                          )}`}
                        >
                          {renderActionIcon(
                            auditLog.action,
                          )}

                          {formatAction(
                            auditLog.action,
                          )}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatEntity(
                            auditLog.entity,
                          )}
                        </strong>

                        <span>
                          {auditLog.entityId ??
                            "Sem identificador"}
                        </span>
                      </td>

                      <td>
                        <div className="audit-user-cell">
                          <div>
                            <UserRound
                              size={17}
                            />
                          </div>

                          <section>
                            <strong>
                              {auditLog
                                .user
                                ?.name ??
                                "Usuário removido"}
                            </strong>

                            <span>
                              {auditLog
                                .user
                                ?.email ??
                                "Sem e-mail"}
                            </span>
                          </section>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {auditLog.description
                            ? shortenText(
                                auditLog.description,
                                55,
                              )
                            : "Sem descrição"}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {auditLog.ipAddress ??
                            "IP não informado"}
                        </strong>

                        <span>
                          {auditLog.userAgent
                            ? shortenText(
                                auditLog.userAgent,
                                45,
                              )
                            : "Navegador não informado"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatDate(
                            auditLog.createdAt,
                          )}
                        </strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="audit-details-button"
                          onClick={() => {
                            void openDetails(
                              auditLog,
                            );
                          }}
                        >
                          <Eye size={16} />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loadingLogs &&
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

      {selectedAudit && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeDetails
          }
        >
          <section
            className="audit-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="audit-details-header">
              <div>
                <span className="eyebrow">
                  REGISTRO DE AUDITORIA
                </span>

                <h2>
                  {formatAction(
                    selectedAudit.action,
                  )}
                </h2>

                <p>
                  {formatEntity(
                    selectedAudit.entity,
                  )}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={
                  closeDetails
                }
              >
                <X size={21} />
              </button>
            </header>

            <div className="audit-details-content">
              {detailsError && (
                <div className="form-error">
                  {detailsError}
                </div>
              )}

              {loadingDetails ? (
                <div className="audit-state">
                  <LoaderCircle
                    size={28}
                    className="icon-spinning"
                  />

                  Carregando detalhes...
                </div>
              ) : (
                <>
                  <section className="audit-detail-hero">
                    <span
                      className={`audit-action audit-action-${getActionClass(
                        selectedAudit.action,
                      )}`}
                    >
                      {renderActionIcon(
                        selectedAudit.action,
                      )}

                      {formatAction(
                        selectedAudit.action,
                      )}
                    </span>

                    <div>
                      <Clock3
                        size={17}
                      />

                      <strong>
                        {formatDate(
                          selectedAudit.createdAt,
                        )}
                      </strong>
                    </div>
                  </section>

                  <section className="audit-detail-section">
                    <div className="audit-section-title">
                      <ShieldCheck
                        size={19}
                      />

                      <h3>
                        Informações da ação
                      </h3>
                    </div>

                    <div className="audit-info-grid">
                      <div>
                        <span>
                          ID do registro
                        </span>

                        <strong>
                          {
                            selectedAudit.id
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Entidade
                        </span>

                        <strong>
                          {formatEntity(
                            selectedAudit.entity,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          ID da entidade
                        </span>

                        <strong>
                          {selectedAudit.entityId ??
                            "Não informado"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Descrição
                        </span>

                        <strong>
                          {selectedAudit.description ??
                            "Não informada"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="audit-detail-section">
                    <div className="audit-section-title">
                      <UserRound
                        size={19}
                      />

                      <h3>
                        Administrador
                      </h3>
                    </div>

                    <div className="audit-info-grid">
                      <div>
                        <span>Nome</span>

                        <strong>
                          {selectedAudit
                            .user?.name ??
                            "Usuário removido"}
                        </strong>
                      </div>

                      <div>
                        <span>E-mail</span>

                        <strong>
                          {selectedAudit
                            .user?.email ??
                            "Não informado"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Public ID
                        </span>

                        <strong>
                          {selectedAudit
                            .user
                            ?.publicId ??
                            "Não informado"}
                        </strong>
                      </div>

                      <div>
                        <span>Perfil</span>

                        <strong>
                          {selectedAudit
                            .user?.role ??
                            "Não informado"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="audit-detail-section">
                    <div className="audit-section-title">
                      <Globe2
                        size={19}
                      />

                      <h3>
                        Origem da requisição
                      </h3>
                    </div>

                    <div className="audit-origin-list">
                      <div>
                        <span>
                          Endereço IP
                        </span>

                        <strong>
                          {selectedAudit.ipAddress ??
                            "Não informado"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Navegador/dispositivo
                        </span>

                        <strong>
                          {selectedAudit.userAgent ??
                            "Não informado"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="audit-detail-section">
                    <div className="audit-section-title">
                      <Code2 size={19} />

                      <h3>
                        Alterações registradas
                      </h3>
                    </div>

                    <div className="audit-json-grid">
                      <article>
                        <header>
                          <span>
                            Antes
                          </span>
                        </header>

                        <pre>
                          {formatJson(
                            selectedAudit.before,
                          )}
                        </pre>
                      </article>

                      <article>
                        <header>
                          <span>
                            Depois
                          </span>
                        </header>

                        <pre>
                          {formatJson(
                            selectedAudit.after,
                          )}
                        </pre>
                      </article>
                    </div>
                  </section>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}