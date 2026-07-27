import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  ImageIcon,
  Images,
  LoaderCircle,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  apiRequest,
} from "../lib/api";

import type {
  Banner,
  BannerPosition,
  BannerResponse,
  BannersResponse,
  BannerUploadResponse,
} from "../types/banners";

import type {
  Pagination,
} from "../types/orders";

type BannerState =
  | "ACTIVE"
  | "INACTIVE"
  | "SCHEDULED"
  | "EXPIRED";

interface BannerFilters {
  search: string;

  position:
    | BannerPosition
    | "";

  active:
    | ""
    | "true"
    | "false";

  sortOrder:
    | "asc"
    | "desc";
}

interface BannerForm {
  title: string;
  subtitle: string;

  link: string;
  buttonText: string;

  position: BannerPosition;
  sortOrder: string;

  startsAt: string;
  endsAt: string;

  active: boolean;
}

const initialFilters:
  BannerFilters = {
    search: "",
    position: "",
    active: "",
    sortOrder: "asc",
  };

const initialForm:
  BannerForm = {
    title: "",
    subtitle: "",

    link: "",
    buttonText: "",

    position: "HOME_HERO",
    sortOrder: "0",

    startsAt: "",
    endsAt: "",

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

const positions:
  BannerPosition[] = [
    "HOME_HERO",
    "HOME_MIDDLE",
    "CATEGORY",
    "PROMOTION",
  ];

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const maximumImageSize =
  5 * 1024 * 1024;

function formatPosition(
  position: BannerPosition,
) {
  const labels: Record<
    BannerPosition,
    string
  > = {
    HOME_HERO:
      "Destaque principal",

    HOME_MIDDLE:
      "Meio da página inicial",

    CATEGORY:
      "Página de categoria",

    PROMOTION:
      "Promoções",
  };

  return labels[position];
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "Não definido";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function getBannerState(
  banner: Banner,
): BannerState {
  if (!banner.active) {
    return "INACTIVE";
  }

  const now = new Date();

  if (
    banner.startsAt &&
    new Date(
      banner.startsAt,
    ) > now
  ) {
    return "SCHEDULED";
  }

  if (
    banner.endsAt &&
    new Date(
      banner.endsAt,
    ) < now
  ) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

function formatBannerState(
  state: BannerState,
) {
  const labels: Record<
    BannerState,
    string
  > = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    SCHEDULED: "Agendado",
    EXPIRED: "Encerrado",
  };

  return labels[state];
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

function toIsoOrNull(
  value: string,
) {
  if (!value) {
    return null;
  }

  return new Date(
    value,
  ).toISOString();
}

function revokePreview(
  preview: string,
) {
  if (
    preview.startsWith(
      "blob:",
    )
  ) {
    URL.revokeObjectURL(
      preview,
    );
  }
}

export function BannersPage() {
  const [banners, setBanners] =
    useState<Banner[]>([]);

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
    useState<BannerFilters>(
      initialFilters,
    );

  const [filters, setFilters] =
    useState<BannerFilters>(
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
    editingBanner,
    setEditingBanner,
  ] =
    useState<Banner | null>(
      null,
    );

  const [form, setForm] =
    useState<BannerForm>(
      initialForm,
    );

  const [
    desktopFile,
    setDesktopFile,
  ] = useState<File | null>(
    null,
  );

  const [
    mobileFile,
    setMobileFile,
  ] = useState<File | null>(
    null,
  );

  const [
    desktopPreview,
    setDesktopPreview,
  ] = useState("");

  const [
    mobilePreview,
    setMobilePreview,
  ] = useState("");

  const [
    removeMobile,
    setRemoveMobile,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    actionBannerId,
    setActionBannerId,
  ] =
    useState<string | null>(
      null,
    );

  const loadBanners =
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

      if (filters.position) {
        query.set(
          "position",
          filters.position,
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
            BannersResponse
          >(
            `/admin/banners/?${query.toString()}`,
          );

        setBanners(
          response.data,
        );

        setPagination(
          response.pagination,
        );
      } catch (caughtError) {
        setBanners([]);

        setPagination(
          emptyPagination,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar os banners.",
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
        void loadBanners();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [loadBanners]);

  const summary =
    useMemo(() => {
      const states =
        banners.map(
          getBannerState,
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
                "INACTIVE" ||
              state ===
                "EXPIRED",
          ).length,
      };
    }, [banners]);

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

  function resetImages() {
    revokePreview(
      desktopPreview,
    );

    revokePreview(
      mobilePreview,
    );

    setDesktopFile(null);
    setMobileFile(null);

    setDesktopPreview("");
    setMobilePreview("");

    setRemoveMobile(false);
  }

  function openCreateModal() {
    resetImages();

    setEditingBanner(null);
    setForm(initialForm);

    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(
    banner: Banner,
  ) {
    resetImages();

    setEditingBanner(banner);

    setForm({
      title: banner.title,

      subtitle:
        banner.subtitle ?? "",

      link:
        banner.link ?? "",

      buttonText:
        banner.buttonText ?? "",

      position:
        banner.position,

      sortOrder:
        String(
          banner.sortOrder,
        ),

      startsAt:
        toDateTimeLocal(
          banner.startsAt,
        ),

      endsAt:
        toDateTimeLocal(
          banner.endsAt,
        ),

      active: banner.active,
    });

    setDesktopPreview(
      banner.imageUrl,
    );

    setMobilePreview(
      banner.mobileImageUrl ??
        "",
    );

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    resetImages();

    setModalOpen(false);
    setEditingBanner(null);

    setForm(initialForm);
    setFormError("");
  }

  function selectImage(
    type:
      | "desktop"
      | "mobile",

    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      !allowedImageTypes.includes(
        selectedFile.type,
      )
    ) {
      event.target.value = "";

      setFormError(
        "Use uma imagem JPEG, PNG, WebP ou AVIF.",
      );

      return;
    }

    if (
      selectedFile.size >
      maximumImageSize
    ) {
      event.target.value = "";

      setFormError(
        "Cada imagem deve possuir no máximo 5 MB.",
      );

      return;
    }

    setFormError("");

    const preview =
      URL.createObjectURL(
        selectedFile,
      );

    if (type === "desktop") {
      revokePreview(
        desktopPreview,
      );

      setDesktopFile(
        selectedFile,
      );

      setDesktopPreview(
        preview,
      );

      return;
    }

    revokePreview(
      mobilePreview,
    );

    setMobileFile(
      selectedFile,
    );

    setMobilePreview(
      preview,
    );

    setRemoveMobile(false);
  }

  function removeMobileImage() {
    revokePreview(
      mobilePreview,
    );

    setMobileFile(null);
    setMobilePreview("");

    setRemoveMobile(true);
  }

  async function uploadImage(
    file: File,
  ) {
    const formData =
      new FormData();

    formData.append(
      "image",
      file,
    );

    const response =
      await apiRequest<
        BannerUploadResponse
      >(
        "/admin/banners/upload",
        {
          method: "POST",
          body: formData,
        },
      );

    return response.data;
  }

  async function handleSave(
    event: FormEvent,
  ) {
    event.preventDefault();

    const title =
      form.title.trim();

    if (title.length < 2) {
      setFormError(
        "Informe um título válido.",
      );

      return;
    }

    if (
      !editingBanner &&
      !desktopFile
    ) {
      setFormError(
        "Selecione a imagem principal do banner.",
      );

      return;
    }

    const sortOrder =
      Number(form.sortOrder);

    if (
      !Number.isInteger(
        sortOrder,
      ) ||
      sortOrder < 0
    ) {
      setFormError(
        "Informe uma ordem válida.",
      );

      return;
    }

    const startsAt =
      toIsoOrNull(
        form.startsAt,
      );

    const endsAt =
      toIsoOrNull(
        form.endsAt,
      );

    if (
      startsAt &&
      endsAt &&
      new Date(startsAt) >=
        new Date(endsAt)
    ) {
      setFormError(
        "O encerramento deve ser posterior ao início.",
      );

      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const desktopUpload =
        desktopFile
          ? await uploadImage(
              desktopFile,
            )
          : null;

      const mobileUpload =
        mobileFile
          ? await uploadImage(
              mobileFile,
            )
          : null;

      if (editingBanner) {
        await apiRequest<
          BannerResponse
        >(
          `/admin/banners/${editingBanner.id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              title,

              subtitle:
                form.subtitle.trim() ||
                null,

              imageUrl:
                desktopUpload?.url ??
                editingBanner.imageUrl,

              publicId:
                desktopUpload?.publicId ??
                editingBanner.publicId,

              mobileImageUrl:
                removeMobile
                  ? null
                  : mobileUpload?.url ??
                    editingBanner
                      .mobileImageUrl,

              mobilePublicId:
                removeMobile
                  ? null
                  : mobileUpload
                        ?.publicId ??
                    editingBanner
                      .mobilePublicId,

              link:
                form.link.trim() ||
                null,

              buttonText:
                form.buttonText.trim() ||
                null,

              position:
                form.position,

              sortOrder,

              active:
                form.active,

              startsAt,
              endsAt,
            }),
          },
        );

        setSuccessMessage(
          "Banner atualizado com sucesso.",
        );
      } else {
        if (!desktopUpload) {
          throw new Error(
            "Não foi possível enviar a imagem principal.",
          );
        }

        await apiRequest<
          BannerResponse
        >(
          "/admin/banners/",
          {
            method: "POST",

            body: JSON.stringify({
              title,

              subtitle:
                form.subtitle.trim() ||
                undefined,

              imageUrl:
                desktopUpload.url,

              publicId:
                desktopUpload.publicId,

              mobileImageUrl:
                mobileUpload?.url,

              mobilePublicId:
                mobileUpload?.publicId,

              link:
                form.link.trim() ||
                undefined,

              buttonText:
                form.buttonText.trim() ||
                undefined,

              position:
                form.position,

              sortOrder,

              active:
                form.active,

              startsAt:
                startsAt ??
                undefined,

              endsAt:
                endsAt ??
                undefined,
            }),
          },
        );

        setSuccessMessage(
          "Banner criado com sucesso.",
        );
      }

      resetImages();

      setModalOpen(false);
      setEditingBanner(null);

      setForm(initialForm);

      await loadBanners();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível salvar o banner.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    banner: Banner,
  ) {
    setActionBannerId(
      banner.id,
    );

    setError("");

    try {
      const response =
        await apiRequest<
          BannerResponse
        >(
          `/admin/banners/${banner.id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              active:
                !banner.active,
            }),
          },
        );

      setBanners(
        (currentBanners) =>
          currentBanners.map(
            (currentBanner) =>
              currentBanner.id ===
              banner.id
                ? response.data
                    .banner
                : currentBanner,
          ),
      );

      setSuccessMessage(
        banner.active
          ? "Banner desativado."
          : "Banner ativado.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível alterar o status.",
      );
    } finally {
      setActionBannerId(null);
    }
  }

  async function deleteBanner(
    banner: Banner,
  ) {
    const confirmed =
      window.confirm(
        `Excluir o banner "${banner.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    setActionBannerId(
      banner.id,
    );

    setError("");

    try {
      await apiRequest(
        `/admin/banners/${banner.id}`,
        {
          method: "DELETE",
        },
      );

      setSuccessMessage(
        "Banner excluído com sucesso.",
      );

      await loadBanners();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível excluir o banner.",
      );
    } finally {
      setActionBannerId(null);
    }
  }

  return (
    <div className="banners-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            CONTEÚDO
          </span>

          <h1>Banners</h1>

          <p>
            Gerencie os destaques
            visuais da loja.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void loadBanners();
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
            Novo banner
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

      <section className="banner-summary-grid">
        <article>
          <Images size={21} />

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
          <Monitor size={21} />

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
          <ImageIcon size={21} />

          <div>
            <span>
              Indisponíveis
            </span>

            <strong>
              {summary.unavailable}
            </strong>
          </div>
        </article>
      </section>

      <form
        className="banners-filter-panel"
        onSubmit={applyFilters}
      >
        <div className="banner-search">
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
            placeholder="Título ou subtítulo"
          />
        </div>

        <select
          value={
            draftFilters.position
          }
          onChange={(event) =>
            setDraftFilters(
              (current) => ({
                ...current,

                position:
                  event.target
                    .value as
                    | BannerPosition
                    | "",
              }),
            )
          }
        >
          <option value="">
            Todas as posições
          </option>

          {positions.map(
            (position) => (
              <option
                value={position}
                key={position}
              >
                {formatPosition(
                  position,
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
                    BannerFilters["active"],
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
          <option value="asc">
            Menor ordem
          </option>

          <option value="desc">
            Maior ordem
          </option>
        </select>

        <div className="banner-filter-actions">
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

      <section className="banners-panel">
        {loading ? (
          <div className="banners-state">
            <LoaderCircle
              size={28}
              className="icon-spinning"
            />

            Carregando banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="banners-state">
            <Images size={35} />

            <strong>
              Nenhum banner
              encontrado.
            </strong>

            <span>
              Crie um banner ou
              altere os filtros.
            </span>
          </div>
        ) : (
          <div className="banner-grid">
            {banners.map(
              (banner) => {
                const state =
                  getBannerState(
                    banner,
                  );

                return (
                  <article
                    className="banner-card"
                    key={banner.id}
                  >
                    <div className="banner-card-image">
                      <img
                        src={
                          banner.imageUrl
                        }
                        alt={
                          banner.title
                        }
                      />

                      <span
                        className={`banner-state banner-state-${state.toLowerCase()}`}
                      >
                        {formatBannerState(
                          state,
                        )}
                      </span>

                      <span className="banner-position">
                        {formatPosition(
                          banner.position,
                        )}
                      </span>
                    </div>

                    <div className="banner-card-content">
                      <div className="banner-title-row">
                        <div>
                          <h2>
                            {banner.title}
                          </h2>

                          <span>
                            Ordem{" "}
                            {
                              banner.sortOrder
                            }
                          </span>
                        </div>

                        {banner.mobileImageUrl && (
                          <span title="Possui imagem mobile">
  <Smartphone
    size={18}
    aria-hidden="true"
  />
</span>
                        )}
                      </div>

                      <p>
                        {banner.subtitle ??
                          "Nenhum subtítulo informado."}
                      </p>

                      <div className="banner-period-grid">
                        <div>
                          <span>
                            Início
                          </span>

                          <strong>
                            {banner.startsAt
                              ? formatDate(
                                  banner.startsAt,
                                )
                              : "Imediato"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Encerramento
                          </span>

                          <strong>
                            {banner.endsAt
                              ? formatDate(
                                  banner.endsAt,
                                )
                              : "Sem limite"}
                          </strong>
                        </div>
                      </div>

                      {banner.link && (
                        <a
                          href={
                            banner.link
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="banner-link-preview"
                        >
                          <ExternalLink
                            size={14}
                          />

                          {banner.buttonText ??
                            banner.link}
                        </a>
                      )}
                    </div>

                    <footer className="banner-card-footer">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            banner,
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
                        disabled={
                          actionBannerId ===
                          banner.id
                        }
                        onClick={() => {
                          void toggleStatus(
                            banner,
                          );
                        }}
                      >
                        {actionBannerId ===
                        banner.id ? (
                          <LoaderCircle
                            size={16}
                            className="icon-spinning"
                          />
                        ) : (
                          <Monitor
                            size={16}
                          />
                        )}

                        {banner.active
                          ? "Desativar"
                          : "Ativar"}
                      </button>

                      <button
                        type="button"
                        className="banner-delete-button"
                        disabled={
                          actionBannerId ===
                          banner.id
                        }
                        onClick={() => {
                          void deleteBanner(
                            banner,
                          );
                        }}
                      >
                        <Trash2
                          size={16}
                        />
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
            className="banner-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="category-modal-header">
              <div>
                <span className="eyebrow">
                  {editingBanner
                    ? "EDIÇÃO"
                    : "CADASTRO"}
                </span>

                <h2>
                  {editingBanner
                    ? "Editar banner"
                    : "Novo banner"}
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
              className="banner-form"
              onSubmit={handleSave}
            >
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}

              <section className="banner-form-section">
                <h3>Conteúdo</h3>

                <div className="banner-form-grid">
                  <label className="banner-form-full">
                    <span>Título</span>

                    <input
                      value={
                        form.title
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            title:
                              event.target
                                .value,
                          }),
                        )
                      }
                      minLength={2}
                      maxLength={150}
                      required
                      autoFocus
                    />
                  </label>

                  <label className="banner-form-full">
                    <span>
                      Subtítulo
                    </span>

                    <textarea
                      value={
                        form.subtitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            subtitle:
                              event.target
                                .value,
                          }),
                        )
                      }
                      maxLength={300}
                      rows={3}
                    />
                  </label>

                  <label>
                    <span>
                      Texto do botão
                    </span>

                    <input
                      value={
                        form.buttonText
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            buttonText:
                              event.target
                                .value,
                          }),
                        )
                      }
                      maxLength={60}
                      placeholder="Comprar agora"
                    />
                  </label>

                  <label>
                    <span>
                      Link de destino
                    </span>

                    <input
                      value={
                        form.link
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            link:
                              event.target
                                .value,
                          }),
                        )
                      }
                      maxLength={500}
                      placeholder="/produtos ou https://..."
                    />
                  </label>
                </div>
              </section>

              <section className="banner-form-section">
                <h3>Imagens</h3>

                <div className="banner-images-form-grid">
                  <label className="banner-upload-card">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                      onChange={(
                        event,
                      ) =>
                        selectImage(
                          "desktop",
                          event,
                        )
                      }
                    />

                    {desktopPreview ? (
                      <img
                        src={
                          desktopPreview
                        }
                        alt="Banner desktop"
                      />
                    ) : (
                      <div>
                        <Monitor
                          size={29}
                        />

                        <strong>
                          Imagem desktop
                        </strong>

                        <span>
                          Obrigatória
                        </span>
                      </div>
                    )}

                    <small>
                      <Upload
                        size={14}
                      />

                      Selecionar
                    </small>
                  </label>

                  <div className="banner-mobile-upload-wrapper">
                    <label className="banner-upload-card">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                        onChange={(
                          event,
                        ) =>
                          selectImage(
                            "mobile",
                            event,
                          )
                        }
                      />

                      {mobilePreview ? (
                        <img
                          src={
                            mobilePreview
                          }
                          alt="Banner mobile"
                        />
                      ) : (
                        <div>
                          <Smartphone
                            size={29}
                          />

                          <strong>
                            Imagem mobile
                          </strong>

                          <span>
                            Opcional
                          </span>
                        </div>
                      )}

                      <small>
                        <Upload
                          size={14}
                        />

                        Selecionar
                      </small>
                    </label>

                    {mobilePreview && (
                      <button
                        type="button"
                        className="remove-mobile-banner-button"
                        onClick={
                          removeMobileImage
                        }
                      >
                        <Trash2
                          size={15}
                        />

                        Remover imagem
                        mobile
                      </button>
                    )}
                  </div>
                </div>

                <p className="banner-image-help">
                  JPEG, PNG, WebP ou
                  AVIF. Máximo de 5 MB
                  por imagem.
                </p>
              </section>

              <section className="banner-form-section">
                <h3>
                  Exibição
                </h3>

                <div className="banner-form-grid">
                  <label>
                    <span>Posição</span>

                    <select
                      value={
                        form.position
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            position:
                              event.target
                                .value as
                                BannerPosition,
                          }),
                        )
                      }
                    >
                      {positions.map(
                        (position) => (
                          <option
                            value={
                              position
                            }
                            key={
                              position
                            }
                          >
                            {formatPosition(
                              position,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Ordem</span>

                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={
                        form.sortOrder
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            sortOrder:
                              event.target
                                .value,
                          }),
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>Início</span>

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
                      Encerramento
                    </span>

                    <input
                      type="datetime-local"
                      value={
                        form.endsAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setForm(
                          (current) => ({
                            ...current,

                            endsAt:
                              event.target
                                .value,
                          }),
                        )
                      }
                    />
                  </label>
                </div>
              </section>

              <label className="banner-active-checkbox">
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
                    Banner habilitado
                  </strong>

                  <span>
                    O período de início e
                    encerramento também
                    será respeitado.
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
                  ) : editingBanner ? (
                    "Salvar alterações"
                  ) : (
                    "Criar banner"
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