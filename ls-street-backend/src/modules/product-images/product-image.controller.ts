import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  ProductImageService,
  ProductImageServiceError,
  type CreateProductImageInput,
  type ProductImageFile,
  type UpdateProductImageInput,
} from "./product-image.service";

interface ProductParams {
  productId: string;
}

interface ProductImageParams {
  id: string;
}

interface MultipartImageData {
  file?: ProductImageFile;
  altText?: string | null;
  position?: number;
  isPrimary?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function parseBoolean(
  value: string | undefined,
): boolean | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new ProductImageServiceError(
    'O campo "isPrimary" deve ser true ou false.',
    {
      statusCode: 422,
      code: "INVALID_IS_PRIMARY",
    },
  );
}

function parsePosition(
  value: string | undefined,
): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const position = Number(value);

  if (
    !Number.isInteger(position) ||
    position < 0
  ) {
    throw new ProductImageServiceError(
      'O campo "position" deve ser um número inteiro maior ou igual a zero.',
      {
        statusCode: 422,
        code: "INVALID_IMAGE_POSITION",
      },
    );
  }

  return position;
}

function normalizeFieldValue(
  value: unknown,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    value !== null &&
    typeof value === "object" &&
    "value" in value
  ) {
    const fieldValue = (
      value as {
        value?: unknown;
      }
    ).value;

    return typeof fieldValue === "string"
      ? fieldValue
      : String(fieldValue ?? "");
  }

  return String(value ?? "");
}

export class ProductImageController {
  constructor(
    private readonly service: ProductImageService,
  ) {}

  private handleError(
    error: unknown,
    reply: FastifyReply,
  ) {
    if (error instanceof ProductImageServiceError) {
      return reply
        .status(error.statusCode)
        .send({
          message: error.message,
          code: error.code,
        });
    }

    throw error;
  }

  private async readMultipart(
    request: FastifyRequest,
  ): Promise<MultipartImageData> {
    if (!request.isMultipart()) {
      throw new ProductImageServiceError(
        "A requisição deve utilizar multipart/form-data.",
        {
          statusCode: 415,
          code: "MULTIPART_REQUIRED",
        },
      );
    }

    const result: MultipartImageData = {};

    let altTextValue: string | undefined;
    let positionValue: string | undefined;
    let isPrimaryValue: string | undefined;

    for await (const part of request.parts({
      limits: {
        files: 1,
        fileSize: MAX_IMAGE_SIZE,
      },
    })) {
      if (part.type === "file") {
        if (result.file) {
          part.file.resume();

          throw new ProductImageServiceError(
            "Envie somente uma imagem por requisição.",
            {
              statusCode: 422,
              code: "MULTIPLE_IMAGES_NOT_ALLOWED",
            },
          );
        }

        const buffer = await part.toBuffer();

        result.file = {
          buffer,
          filename: part.filename,
          mimetype: part.mimetype,
        };

        continue;
      }

      const value = normalizeFieldValue(part);

      switch (part.fieldname) {
        case "altText":
          altTextValue = value;
          break;

        case "position":
          positionValue = value;
          break;

        case "isPrimary":
          isPrimaryValue = value;
          break;

        default:
          break;
      }
    }

    if (altTextValue !== undefined) {
      result.altText =
        altTextValue.trim().length > 0
          ? altTextValue.trim()
          : null;
    }

    result.position = parsePosition(positionValue);
    result.isPrimary = parseBoolean(
      isPrimaryValue,
    );

    return result;
  }

  async listByProduct(
    request: FastifyRequest<{
      Params: ProductParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const images =
        await this.service.listByProduct(
          request.params.productId,
        );

      return reply.status(200).send({
        images,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  async findById(
    request: FastifyRequest<{
      Params: ProductImageParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const image =
        await this.service.findById(
          request.params.id,
        );

      return reply.status(200).send({
        image,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  async create(
    request: FastifyRequest<{
      Params: ProductParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const multipart =
        await this.readMultipart(request);

      if (!multipart.file) {
        throw new ProductImageServiceError(
          "A imagem é obrigatória.",
          {
            statusCode: 422,
            code: "PRODUCT_IMAGE_REQUIRED",
          },
        );
      }

      const input: CreateProductImageInput = {
        file: multipart.file,
        altText: multipart.altText,
        position: multipart.position,
        isPrimary: multipart.isPrimary,
      };

      const image = await this.service.create(
        request.params.productId,
        input,
      );

      return reply.status(201).send({
        message: "Imagem adicionada com sucesso.",
        image,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: ProductImageParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const multipart =
        await this.readMultipart(request);

      const hasChanges =
        multipart.file !== undefined ||
        multipart.altText !== undefined ||
        multipart.position !== undefined ||
        multipart.isPrimary !== undefined;

      if (!hasChanges) {
        throw new ProductImageServiceError(
          "Informe pelo menos um campo para atualizar.",
          {
            statusCode: 422,
            code: "NO_PRODUCT_IMAGE_CHANGES",
          },
        );
      }

      const input: UpdateProductImageInput = {
        file: multipart.file,
        altText: multipart.altText,
        position: multipart.position,
        isPrimary: multipart.isPrimary,
      };

      const image = await this.service.update(
        request.params.id,
        input,
      );

      return reply.status(200).send({
        message: "Imagem atualizada com sucesso.",
        image,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  async setPrimary(
    request: FastifyRequest<{
      Params: ProductImageParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const image =
        await this.service.setPrimary(
          request.params.id,
        );

      return reply.status(200).send({
        message:
          "Imagem principal definida com sucesso.",
        image,
      });
    } catch (error) {
      return this.handleError(error, reply);
    }
  }

  async delete(
    request: FastifyRequest<{
      Params: ProductImageParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      await this.service.delete(
        request.params.id,
      );

      return reply.status(204).send();
    } catch (error) {
      return this.handleError(error, reply);
    }
  }
}