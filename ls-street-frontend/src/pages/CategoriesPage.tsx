import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Edit3,
  FolderOpen,
  ImageIcon,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Tags,
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
  CategoriesResponse,
  Category,
  CategoryPagination,
  CategoryResponse,
} from "../types/categories";

interface CategoryFilters {
  search: string;
  isActive: "" | "true" | "false";
  sortOrder: "asc" | "desc";
}

interface CategoryForm {
  name: string;
  description: string;
  imageUrl: string;
}

const initialFilters: CategoryFilters = {
  search: "",
  isActive: "",
  sortOrder: "asc",
};

const initialForm: CategoryForm = {
  name: "",
  description: "",
  imageUrl: "",
};

const emptyPagination: CategoryPagination = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

export function CategoriesPage() {
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
    useState<CategoryFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<CategoryFilters>(
      initialFilters,
    );

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingCategory,
    setEditingCategory,
  ] =
    useState<Category | null>(
      null,
    );

  const [form, setForm] =
    useState<CategoryForm>(
      initialForm,
    );

  const [
    saving,
    setSaving,
  ] = useState(false);

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

  const loadCategories =
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

      if (filters.isActive) {
        query.set(
          "isActive",
          filters.isActive,
        );
      }

      try {
        const response =
          await apiRequest<
            CategoriesResponse
          >(
            `/categories/admin?${query.toString()}`,
          );

        setCategories(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setCategories([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar as categorias.",
        );
      } finally {
        setLoading(false);
      }
    }, [filters, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [loadCategories]);

  const activeCount =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.isActive,
        ).length,
      [categories],
    );

  const inactiveCount =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            !category.isActive,
        ).length,
      [categories],
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
    setEditingCategory(null);

    setForm(initialForm);

    setFormError("");

    setModalOpen(true);
  }

  function openEditModal(
    category: Category,
  ) {
    setEditingCategory(category);

    setForm({
      name: category.name,

      description:
        category.description ?? "",

      imageUrl:
        category.imageUrl ?? "",
    });

    setFormError("");

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingCategory(null);

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
        "O nome deve possuir pelo menos 2 caracteres.",
      );

      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingCategory) {
        const body = {
          name,

          description:
            form.description.trim() ||
            null,

          imageUrl:
            form.imageUrl.trim() ||
            null,
        };

        await apiRequest<
          CategoryResponse
        >(
          `/categories/admin/${editingCategory.id}`,
          {
            method: "PUT",

            body: JSON.stringify(
              body,
            ),
          },
        );

        setSuccessMessage(
          "Categoria atualizada com sucesso.",
        );
      } else {
        const body: {
          name: string;
          description?: string;
          imageUrl?: string;
        } = {
          name,
        };

        if (
          form.description.trim()
        ) {
          body.description =
            form.description.trim();
        }

        if (form.imageUrl.trim()) {
          body.imageUrl =
            form.imageUrl.trim();
        }

        await apiRequest<
          CategoryResponse
        >(
          "/categories/admin",
          {
            method: "POST",

            body: JSON.stringify(
              body,
            ),
          },
        );

        setSuccessMessage(
          "Categoria criada com sucesso.",
        );
      }

      closeModal();

      await loadCategories();
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
          "Não foi possível salvar a categoria.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    category: Category,
  ) {
    setChangingStatusId(
      category.id,
    );

    setError("");

    try {
      const response =
        await apiRequest<
          CategoryResponse
        >(
          `/categories/admin/${category.id}/status`,
          {
            method: "PATCH",

            body: JSON.stringify({
              isActive:
                !category.isActive,
            }),
          },
        );

      setCategories(
        (currentCategories) =>
          currentCategories.map(
            (currentCategory) =>
              currentCategory.id ===
              category.id
                ? response.data
                    .category
                : currentCategory,
          ),
      );

      setSuccessMessage(
        category.isActive
          ? "Categoria desativada com sucesso."
          : "Categoria ativada com sucesso.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível alterar o status da categoria.",
      );
    } finally {
      setChangingStatusId(
        null,
      );
    }
  }

  return (
    <div className="categories-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            CATÁLOGO
          </span>

          <h1>Categorias</h1>

          <p>
            Organize os produtos
            exibidos na loja.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void loadCategories();
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
            Nova categoria
          </button>
        </div>
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

      <section className="category-summary-grid">
        <article className="category-summary-card">
          <Tags size={21} />

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

        <article className="category-summary-card">
          <CheckCircle2
            size={21}
          />

          <div>
            <span>
              Ativas nesta página
            </span>

            <strong>
              {activeCount}
            </strong>
          </div>
        </article>

        <article className="category-summary-card">
          <CircleOff size={21} />

          <div>
            <span>
              Inativas nesta página
            </span>

            <strong>
              {inactiveCount}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="categories-filter-panel"
        onSubmit={
          handleFilterSubmit
        }
      >
        <div className="filter-field category-search-field">
          <label htmlFor="category-search">
            Buscar categoria
          </label>

          <div className="filter-input">
            <Search size={17} />

            <input
              id="category-search"
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
              placeholder="Nome, slug ou descrição"
            />
          </div>
        </div>

        <div className="filter-field">
          <label htmlFor="category-status">
            Status
          </label>

          <select
            id="category-status"
            value={
              draftFilters.isActive
            }
            onChange={(event) =>
              setDraftFilters(
                (current) => ({
                  ...current,

                  isActive:
                    event.target
                      .value as
                      | ""
                      | "true"
                      | "false",
                }),
              )
            }
          >
            <option value="">
              Todas
            </option>

            <option value="true">
              Ativas
            </option>

            <option value="false">
              Inativas
            </option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="category-order">
            Ordenação
          </label>

          <select
            id="category-order"
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
            <option value="asc">
              Nome A–Z
            </option>

            <option value="desc">
              Nome Z–A
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

      <section className="categories-list-panel">
        {loading ? (
          <div className="orders-state">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            <span>
              Carregando categorias...
            </span>
          </div>
        ) : error ? (
          <div className="orders-state error-state">
            <strong>
              Não foi possível carregar
              as categorias.
            </strong>

            <span>{error}</span>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void loadCategories();
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : categories.length ===
          0 ? (
          <div className="orders-state">
            <FolderOpen size={33} />

            <strong>
              Nenhuma categoria
              encontrada.
            </strong>

            <span>
              Crie uma categoria ou
              altere os filtros.
            </span>
          </div>
        ) : (
          <div className="category-grid">
            {categories.map(
              (category) => (
                <article
                  className={`category-card ${
                    category.isActive
                      ? ""
                      : "category-card-inactive"
                  }`}
                  key={category.id}
                >
                  <div className="category-image">
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
                      <ImageIcon
                        size={30}
                      />
                    )}

                    <span
                      className={`category-card-status ${
                        category.isActive
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {category.isActive
                        ? "Ativa"
                        : "Inativa"}
                    </span>
                  </div>

                  <div className="category-card-content">
                    <div className="category-card-heading">
                      <div>
                        <h2>
                          {category.name}
                        </h2>

                        <span>
                          /{category.slug}
                        </span>
                      </div>
                    </div>

                    <p>
                      {category.description ??
                        "Nenhuma descrição informada."}
                    </p>

                    <small>
                      Atualizada em{" "}
                      {formatDate(
                        category.updatedAt,
                      )}
                    </small>
                  </div>

                  <footer className="category-card-footer">
                    <button
                      type="button"
                      className="category-edit-button"
                      onClick={() =>
                        openEditModal(
                          category,
                        )
                      }
                    >
                      <Edit3 size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      className={
                        category.isActive
                          ? "category-status-button deactivate"
                          : "category-status-button activate"
                      }
                      disabled={
                        changingStatusId ===
                        category.id
                      }
                      onClick={() => {
                        void toggleStatus(
                          category,
                        );
                      }}
                    >
                      {changingStatusId ===
                      category.id ? (
                        <LoaderCircle
                          size={16}
                          className="icon-spinning"
                        />
                      ) : category.isActive ? (
                        <CircleOff
                          size={16}
                        />
                      ) : (
                        <CheckCircle2
                          size={16}
                        />
                      )}

                      {category.isActive
                        ? "Desativar"
                        : "Ativar"}
                    </button>
                  </footer>
                </article>
              ),
            )}
          </div>
        )}

        {!loading &&
          !error &&
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
            className="category-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="category-modal-header">
              <div>
                <span className="eyebrow">
                  {editingCategory
                    ? "EDIÇÃO"
                    : "CADASTRO"}
                </span>

                <h2>
                  {editingCategory
                    ? "Editar categoria"
                    : "Nova categoria"}
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
              className="category-form"
              onSubmit={
                handleSave
              }
            >
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}

              <label>
                <span>
                  Nome da categoria
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
                  maxLength={80}
                  placeholder="Ex.: Tênis"
                  required
                  autoFocus
                />
              </label>

              <label>
                <span>
                  Descrição
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
                  maxLength={500}
                  placeholder="Descrição opcional da categoria"
                  rows={5}
                />

                <small>
                  {
                    form.description
                      .length
                  }
                  /500
                </small>
              </label>

              <label>
                <span>
                  URL da imagem
                </span>

                <input
                  type="url"
                  value={
                    form.imageUrl
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        imageUrl:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="https://..."
                />
              </label>

              <div className="category-image-preview">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt="Pré-visualização"
                  />
                ) : (
                  <div>
                    <ImageIcon
                      size={30}
                    />

                    <span>
                      Pré-visualização da
                      imagem
                    </span>
                  </div>
                )}
              </div>

              {editingCategory && (
                <div className="category-slug-info">
                  <span>
                    Slug atual
                  </span>

                  <strong>
                    /
                    {
                      editingCategory.slug
                    }
                  </strong>

                  <small>
                    O slug será atualizado
                    automaticamente caso o
                    nome seja alterado.
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
                  ) : editingCategory ? (
                    "Salvar alterações"
                  ) : (
                    "Criar categoria"
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