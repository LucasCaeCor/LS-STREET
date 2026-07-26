import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Images,
  LoaderCircle,
  Plus,
  RefreshCw,
  Star,
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
  ApiError,
} from "../lib/api";

import type {
  ManagedProductImage,
  ProductImageResponse,
  ProductImagesResponse,
} from "../types/product-images";

import type {
  Product,
} from "../types/products";

interface ProductImagesModalProps {
  product: Product | null;
  open: boolean;

  onClose(): void;

  onChanged():
    | Promise<void>
    | void;
}

type ImageModalView =
  | "list"
  | "form";

interface ImageForm {
  altText: string;
  position: string;
  isPrimary: boolean;
}

const initialForm: ImageForm = {
  altText: "",
  position: "0",
  isPrimary: false,
};

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const maxFileSize =
  5 * 1024 * 1024;

export function ProductImagesModal({
  product,
  open,
  onClose,
  onChanged,
}: ProductImagesModalProps) {
  const productId =
    product?.publicId;

  const [images, setImages] =
    useState<
      ManagedProductImage[]
    >([]);

  const [view, setView] =
    useState<ImageModalView>(
      "list",
    );

  const [
    editingImage,
    setEditingImage,
  ] =
    useState<
      ManagedProductImage | null
    >(null);

  const [form, setForm] =
    useState<ImageForm>(
      initialForm,
    );

  const [file, setFile] =
    useState<File | null>(null);

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    actionImageId,
    setActionImageId,
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

  const loadImages =
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
            ProductImagesResponse
          >(
            `/products/${productId}/images`,
          );

        setImages(
          response.images,
        );
      } catch (caughtError) {
        setImages([]);

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : "Não foi possível carregar as imagens.",
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
        void loadImages();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId,
      );
    };
  }, [
    open,
    productId,
    loadImages,
  ]);

  const nextPosition =
    useMemo(() => {
      if (images.length === 0) {
        return 0;
      }

      return (
        Math.max(
          ...images.map(
            (image) =>
              image.position,
          ),
        ) + 1
      );
    }, [images]);

  function revokeLocalPreview() {
    if (
      previewUrl.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }
  }

  function resetForm() {
    revokeLocalPreview();

    setEditingImage(null);
    setFile(null);
    setPreviewUrl("");
    setForm(initialForm);
    setError("");
  }

  function openCreateForm() {
    resetForm();

    setForm({
      altText:
        product?.name ?? "",

      position:
        String(nextPosition),

      isPrimary:
        images.length === 0,
    });

    setView("form");
  }

  function openEditForm(
    image:
      ManagedProductImage,
  ) {
    resetForm();

    setEditingImage(image);

    setForm({
      altText:
        image.altText ?? "",

      position:
        String(image.position),

      isPrimary:
        image.isPrimary,
    });

    setPreviewUrl(image.url);

    setView("form");
  }

  function returnToList() {
    if (saving) {
      return;
    }

    resetForm();
    setView("list");
  }

  function closeModal() {
    if (saving) {
      return;
    }

    revokeLocalPreview();
    onClose();
  }

  function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");

    if (
      !allowedTypes.includes(
        selectedFile.type,
      )
    ) {
      event.target.value = "";

      setError(
        "Use uma imagem JPEG, PNG, WebP ou AVIF.",
      );

      return;
    }

    if (
      selectedFile.size >
      maxFileSize
    ) {
      event.target.value = "";

      setError(
        "A imagem deve possuir no máximo 5 MB.",
      );

      return;
    }

    revokeLocalPreview();

    setFile(selectedFile);

    setPreviewUrl(
      URL.createObjectURL(
        selectedFile,
      ),
    );
  }

  async function refreshAll() {
    await loadImages();
    await onChanged();
  }

  async function handleSave(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!productId) {
      return;
    }

    if (
      !editingImage &&
      !file
    ) {
      setError(
        "Selecione uma imagem.",
      );

      return;
    }

    const position =
      Number(form.position);

    if (
      !Number.isInteger(
        position,
      ) ||
      position < 0
    ) {
      setError(
        "Informe uma posição válida.",
      );

      return;
    }

    const formData =
      new FormData();

    if (file) {
      formData.append(
        "image",
        file,
      );
    }

    formData.append(
      "altText",
      form.altText.trim(),
    );

    formData.append(
      "position",
      String(position),
    );

    formData.append(
      "isPrimary",
      String(form.isPrimary),
    );

    setSaving(true);
    setError("");

    try {
      if (editingImage) {
        await apiRequest<
          ProductImageResponse
        >(
          `/admin/product-images/${editingImage.publicId}`,
          {
            method: "PUT",
            body: formData,
          },
        );

        setSuccessMessage(
          "Imagem atualizada com sucesso.",
        );
      } else {
        await apiRequest<
          ProductImageResponse
        >(
          `/admin/products/${productId}/images`,
          {
            method: "POST",
            body: formData,
          },
        );

        setSuccessMessage(
          "Imagem adicionada com sucesso.",
        );
      }

      resetForm();
      setView("list");

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
          "Não foi possível salvar a imagem.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function setPrimary(
    image:
      ManagedProductImage,
  ) {
    if (image.isPrimary) {
      return;
    }

    setActionImageId(
      image.publicId,
    );

    setError("");

    try {
      await apiRequest<
        ProductImageResponse
      >(
        `/admin/product-images/${image.publicId}/primary`,
        {
          method: "PATCH",
        },
      );

      setSuccessMessage(
        "Imagem principal alterada com sucesso.",
      );

      await refreshAll();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível definir a imagem principal.",
      );
    } finally {
      setActionImageId(null);
    }
  }

  async function deleteImage(
    image:
      ManagedProductImage,
  ) {
    const confirmed =
      window.confirm(
        "Excluir esta imagem do produto?",
      );

    if (!confirmed) {
      return;
    }

    setActionImageId(
      image.publicId,
    );

    setError("");

    try {
      await apiRequest<void>(
        `/admin/product-images/${image.publicId}`,
        {
          method: "DELETE",
        },
      );

      setSuccessMessage(
        "Imagem excluída com sucesso.",
      );

      await refreshAll();
    } catch (caughtError) {
      setError(
        caughtError instanceof
          Error
          ? caughtError.message
          : "Não foi possível excluir a imagem.",
      );
    } finally {
      setActionImageId(null);
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
        className="product-images-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="product-images-header">
          <div className="product-images-title">
            {view === "form" && (
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
                IMAGENS
              </span>

              <h2>
                {view === "list"
                  ? product.name
                  : editingImage
                    ? "Editar imagem"
                    : "Nova imagem"}
              </h2>

              {view === "list" && (
                <p>
                  Gerencie a galeria
                  e a imagem principal.
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
          <div className="product-images-content">
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

            <div className="product-images-toolbar">
              <div>
                <strong>
                  {images.length}
                </strong>

                <span>
                  {images.length === 1
                    ? "imagem cadastrada"
                    : "imagens cadastradas"}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    void loadImages();
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
                    openCreateForm
                  }
                >
                  <Plus size={17} />
                  Nova imagem
                </button>
              </div>
            </div>

            {loading ? (
              <div className="images-empty-state">
                <LoaderCircle
                  size={28}
                  className="icon-spinning"
                />

                Carregando imagens...
              </div>
            ) : images.length === 0 ? (
              <div className="images-empty-state">
                <Images size={35} />

                <strong>
                  Nenhuma imagem
                  cadastrada.
                </strong>

                <span>
                  Adicione a primeira
                  imagem do produto.
                </span>

                <button
                  type="button"
                  className="compact-primary-button"
                  onClick={
                    openCreateForm
                  }
                >
                  <Upload size={17} />
                  Enviar imagem
                </button>
              </div>
            ) : (
              <div className="product-images-grid">
                {images.map(
                  (image) => (
                    <article
                      className="managed-image-card"
                      key={
                        image.publicId
                      }
                    >
                      <div className="managed-image-preview">
                        <img
                          src={image.url}
                          alt={
                            image.altText ??
                            product.name
                          }
                        />

                        {image.isPrimary && (
                          <span className="primary-image-label">
                            <Star
                              size={13}
                              fill="currentColor"
                            />

                            Principal
                          </span>
                        )}
                      </div>

                      <div className="managed-image-info">
                        <strong>
                          {image.altText ??
                            "Sem texto alternativo"}
                        </strong>

                        <span>
                          Posição{" "}
                          {image.position}
                        </span>

                        <small>
                          {image.originalFilename ??
                            "Arquivo enviado"}
                        </small>
                      </div>

                      <footer className="managed-image-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              image,
                            )
                          }
                          title="Editar ou substituir"
                        >
                          <Edit3
                            size={16}
                          />

                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={
                            image.isPrimary ||
                            actionImageId ===
                              image.publicId
                          }
                          onClick={() => {
                            void setPrimary(
                              image,
                            );
                          }}
                          title={
                            image.isPrimary
                              ? "Esta já é a imagem principal"
                              : "Definir como principal"
                          }
                        >
                          {actionImageId ===
                          image.publicId ? (
                            <LoaderCircle
                              size={16}
                              className="icon-spinning"
                            />
                          ) : (
                            <Star
                              size={16}
                            />
                          )}

                          Principal
                        </button>

                        <button
                          type="button"
                          className="managed-image-delete"
                          disabled={
                            actionImageId ===
                            image.publicId
                          }
                          onClick={() => {
                            void deleteImage(
                              image,
                            );
                          }}
                          title="Excluir imagem"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </footer>
                    </article>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {view === "form" && (
          <form
            className="product-image-form"
            onSubmit={
              handleSave
            }
          >
            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <label className="image-upload-area">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
                onChange={
                  handleFileChange
                }
              />

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Pré-visualização"
                />
              ) : (
                <div>
                  <Upload size={31} />

                  <strong>
                    Selecione uma imagem
                  </strong>

                  <span>
                    JPEG, PNG, WebP ou
                    AVIF, até 5 MB
                  </span>
                </div>
              )}

              {previewUrl && (
                <span className="change-image-label">
                  <Upload
                    size={15}
                  />

                  {editingImage
                    ? "Substituir arquivo"
                    : "Escolher outro arquivo"}
                </span>
              )}
            </label>

            {editingImage &&
              !file && (
                <div className="image-edit-notice">
                  Você pode alterar apenas
                  os dados ou selecionar um
                  novo arquivo para
                  substituir a imagem
                  atual.
                </div>
              )}

            <div className="product-image-form-grid">
              <label className="product-image-form-full">
                <span>
                  Texto alternativo
                </span>

                <input
                  value={
                    form.altText
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        altText:
                          event.target
                            .value,
                      }),
                    )
                  }
                  maxLength={255}
                  placeholder="Ex.: Tênis Nike Air preto"
                />

                <small>
                  Utilizado para
                  acessibilidade e SEO.
                </small>
              </label>

              <label>
                <span>Posição</span>

                <input
                  type="number"
                  min={0}
                  step={1}
                  value={
                    form.position
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        position:
                          event.target
                            .value,
                      }),
                    )
                  }
                  required
                />
              </label>

              <label className="primary-image-checkbox">
                <input
                  type="checkbox"
                  checked={
                    form.isPrimary
                  }
                  disabled={
                    Boolean(
                      editingImage?.isPrimary,
                    )
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        isPrimary:
                          event.target
                            .checked,
                      }),
                    )
                  }
                />

                <span>
                  Definir como imagem
                  principal
                </span>
              </label>
            </div>

            {editingImage?.isPrimary && (
              <div className="image-edit-notice">
                Para remover o destaque
                desta imagem, defina outra
                imagem como principal.
              </div>
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
                ) : editingImage ? (
                  "Salvar imagem"
                ) : (
                  "Enviar imagem"
                )}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}