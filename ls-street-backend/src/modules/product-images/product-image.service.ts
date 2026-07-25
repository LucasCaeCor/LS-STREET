import {
  ProductImageRepository,
  type CreateProductImageData,
  type UpdateProductImageData,
} from "./product-image.repository";

import {
  cloudinaryService,
  type UploadImageResult,
} from "../../services/cloudinary/cloudinary.service";

interface ServiceErrorOptions {
  statusCode: number;
  code: string;
}

export class ProductImageServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    options: ServiceErrorOptions,
  ) {
    super(message);

    this.name = "ProductImageServiceError";
    this.statusCode = options.statusCode;
    this.code = options.code;
  }
}

export interface ProductImageFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export interface CreateProductImageInput {
  file: ProductImageFile;
  altText?: string | null;
  position?: number;
  isPrimary?: boolean;
}

export interface UpdateProductImageInput {
  file?: ProductImageFile;
  altText?: string | null;
  position?: number;
  isPrimary?: boolean;
}

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function normalizeOptionalText(
  value: string | null | undefined,
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function sanitizeFilename(filename: string) {
  const nameWithoutExtension = filename.replace(
    /\.[^/.]+$/,
    "",
  );

  const normalized = nameWithoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || undefined;
}

export class ProductImageService {
  constructor(
    private readonly repository: ProductImageRepository,
  ) {}

  private validateFile(file: ProductImageFile) {
    if (!file.buffer || file.buffer.length === 0) {
      throw new ProductImageServiceError(
        "Envie uma imagem válida.",
        {
          statusCode: 422,
          code: "INVALID_IMAGE_FILE",
        },
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new ProductImageServiceError(
        "Formato de imagem não permitido. Use JPEG, PNG, WebP ou AVIF.",
        {
          statusCode: 415,
          code: "UNSUPPORTED_IMAGE_TYPE",
        },
      );
    }

    if (file.buffer.length > MAX_IMAGE_SIZE) {
      throw new ProductImageServiceError(
        "A imagem deve possuir no máximo 5 MB.",
        {
          statusCode: 413,
          code: "IMAGE_TOO_LARGE",
        },
      );
    }
  }

  private async ensureProductExists(
    productPublicId: string,
  ) {
    const product =
      await this.repository.findProductByPublicId(
        productPublicId,
      );

    if (!product) {
      throw new ProductImageServiceError(
        "Produto não encontrado.",
        {
          statusCode: 404,
          code: "PRODUCT_NOT_FOUND",
        },
      );
    }

    return product;
  }

  private async ensureImageExists(
    imagePublicId: string,
  ) {
    const image =
      await this.repository.findByPublicId(
        imagePublicId,
      );

    if (!image) {
      throw new ProductImageServiceError(
        "Imagem não encontrada.",
        {
          statusCode: 404,
          code: "PRODUCT_IMAGE_NOT_FOUND",
        },
      );
    }

    return image;
  }

  private async ensurePositionAvailable(
    productId: string,
    position: number,
    excludeImageId?: string,
  ) {
    const positionExists =
      await this.repository.positionExists(
        productId,
        position,
        excludeImageId,
      );

    if (positionExists) {
      throw new ProductImageServiceError(
        "Já existe uma imagem nessa posição.",
        {
          statusCode: 409,
          code: "PRODUCT_IMAGE_POSITION_ALREADY_EXISTS",
        },
      );
    }
  }

  private async uploadImage(
    productPublicId: string,
    file: ProductImageFile,
  ) {
    this.validateFile(file);

    return cloudinaryService.uploadImage(file.buffer, {
      folder: `ls-street/products/${productPublicId}`,
      filename: sanitizeFilename(file.filename),
    });
  }

  async listByProduct(productPublicId: string) {
    const product =
      await this.ensureProductExists(productPublicId);

    return this.repository.listByProduct(product.id);
  }

  async findById(imagePublicId: string) {
    return this.ensureImageExists(imagePublicId);
  }

  async create(
    productPublicId: string,
    input: CreateProductImageInput,
  ) {
    const product =
      await this.ensureProductExists(productPublicId);

    this.validateFile(input.file);

    const imageCount =
      await this.repository.countByProduct(product.id);

    const position = input.position ?? imageCount;

    await this.ensurePositionAvailable(
      product.id,
      position,
    );

    const shouldBePrimary =
      imageCount === 0 || input.isPrimary === true;

    let uploadedImage: UploadImageResult | undefined;

    try {
      uploadedImage = await this.uploadImage(
        product.publicId,
        input.file,
      );

      if (shouldBePrimary) {
        await this.repository.clearPrimary(product.id);
      }

      const data: CreateProductImageData = {
        productId: product.id,
        url: uploadedImage.url,
        cloudinaryPublicId: uploadedImage.publicId,
        originalFilename: input.file.filename,
        altText:
          normalizeOptionalText(input.altText) ??
          undefined,
        position,
        isPrimary: shouldBePrimary,
      };

      return await this.repository.create(data);
    } catch (error) {
      if (uploadedImage) {
        await cloudinaryService
          .deleteImage(uploadedImage.publicId)
          .catch(() => undefined);
      }

      throw error;
    }
  }

  async update(
    imagePublicId: string,
    input: UpdateProductImageInput,
  ) {
    const image =
      await this.ensureImageExists(imagePublicId);

    if (
      input.position !== undefined &&
      input.position !== image.position
    ) {
      await this.ensurePositionAvailable(
        image.productId,
        input.position,
        image.id,
      );
    }

    let uploadedImage: UploadImageResult | undefined;

    try {
      if (input.file) {
        uploadedImage = await this.uploadImage(
          image.product.publicId,
          input.file,
        );
      }

      if (input.isPrimary === true) {
        await this.repository.clearPrimary(
          image.productId,
          image.id,
        );
      }

      const data: UpdateProductImageData = {};

      if (uploadedImage) {
        data.url = uploadedImage.url;
        data.cloudinaryPublicId =
          uploadedImage.publicId;

        data.originalFilename =
          input.file?.filename ?? null;
      }

      if (input.altText !== undefined) {
        data.altText = normalizeOptionalText(
          input.altText,
        );
      }

      if (input.position !== undefined) {
        data.position = input.position;
      }

      if (input.isPrimary !== undefined) {
        if (
          input.isPrimary === false &&
          image.isPrimary
        ) {
          throw new ProductImageServiceError(
            "Defina outra imagem como principal antes de remover o destaque desta imagem.",
            {
              statusCode: 422,
              code: "PRIMARY_IMAGE_REQUIRED",
            },
          );
        }

        data.isPrimary = input.isPrimary;
      }

      const updatedImage =
        await this.repository.update(image.id, data);

      if (
        uploadedImage &&
        image.cloudinaryPublicId
      ) {
        await cloudinaryService
          .deleteImage(image.cloudinaryPublicId)
          .catch(() => undefined);
      }

      return updatedImage;
    } catch (error) {
      if (uploadedImage) {
        await cloudinaryService
          .deleteImage(uploadedImage.publicId)
          .catch(() => undefined);
      }

      throw error;
    }
  }

  async setPrimary(imagePublicId: string) {
    const image =
      await this.ensureImageExists(imagePublicId);

    if (image.isPrimary) {
      return image;
    }

    await this.repository.clearPrimary(
      image.productId,
      image.id,
    );

    return this.repository.setPrimary(image.id);
  }

  async delete(imagePublicId: string) {
    const image =
      await this.ensureImageExists(imagePublicId);

    const wasPrimary = image.isPrimary;

    await this.repository.delete(image.id);

    if (image.cloudinaryPublicId) {
      await cloudinaryService
        .deleteImage(image.cloudinaryPublicId)
        .catch(() => undefined);
    }

    if (wasPrimary) {
      const nextImage =
        await this.repository.findFirstByProduct(
          image.productId,
          image.id,
        );

      if (nextImage) {
        await this.repository.setPrimary(
          nextImage.id,
        );
      }
    }
  }
}