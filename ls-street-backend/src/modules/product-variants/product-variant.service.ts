import { AppError } from "../../core/errors/app-error";
import { createPaginationMetadata } from "../../core/pagination/pagination";

import {
  ProductVariantRepository,
  type CreateProductVariantData,
  type ListProductVariantsFilters,
  type UpdateProductVariantData,
} from "./product-variant.repository";

import type {
  CreateProductVariantBody,
  ListProductVariantsQuery,
  UpdateProductVariantBody,
  UpdateProductVariantStatusBody,
} from "./product-variant.schema";

export class ProductVariantService {
  constructor(
    private readonly repository: ProductVariantRepository,
  ) {}

  private normalizeSku(value: string): string {
    return value.trim().toUpperCase();
  }

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0
      ? normalized
      : null;
  }

  private async ensureProductExists(
    productPublicId: string,
  ) {
    const product =
      await this.repository.findProductByPublicId(
        productPublicId,
      );

    if (!product) {
      throw new AppError(
        "Produto não encontrado.",
        404,
        "PRODUCT_NOT_FOUND",
      );
    }

    return product;
  }

  private async ensureVariantExists(
    publicId: string,
  ) {
    const variant =
      await this.repository.findByPublicId(publicId);

    if (!variant) {
      throw new AppError(
        "Variante não encontrada.",
        404,
        "PRODUCT_VARIANT_NOT_FOUND",
      );
    }

    return variant;
  }

  private async ensureSkuAvailable(
    sku: string,
    excludeInternalId?: string,
  ) {
    const exists =
      await this.repository.skuExists(
        sku,
        excludeInternalId,
      );

    if (exists) {
      throw new AppError(
        "Já existe uma variante com este SKU.",
        409,
        "PRODUCT_VARIANT_SKU_ALREADY_EXISTS",
      );
    }
  }

  private async ensureCombinationAvailable(
    productId: string,
    color: string | null,
    size: string | null,
    excludeInternalId?: string,
  ) {
    const exists =
      await this.repository.combinationExists(
        productId,
        color,
        size,
        excludeInternalId,
      );

    if (exists) {
      throw new AppError(
        "Já existe uma variante deste produto com a mesma cor e tamanho.",
        409,
        "PRODUCT_VARIANT_COMBINATION_ALREADY_EXISTS",
      );
    }
  }

  private validatePrices(
    priceInCents: number,
    compareAtPriceInCents:
      | number
      | null
      | undefined,
  ) {
    if (
      compareAtPriceInCents !== undefined &&
      compareAtPriceInCents !== null &&
      compareAtPriceInCents < priceInCents
    ) {
      throw new AppError(
        "O preço comparativo não pode ser menor que o preço atual.",
        422,
        "INVALID_COMPARE_AT_PRICE",
      );
    }
  }

  private buildFilters(
    productId: string,
    query: ListProductVariantsQuery,
  ): ListProductVariantsFilters {
    return {
      productId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
      lowStock: query.lowStock,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
  }

  async listByProduct(
    productPublicId: string,
    query: ListProductVariantsQuery,
  ) {
    const product =
      await this.ensureProductExists(
        productPublicId,
      );

    const result =
      await this.repository.listByProduct(
        this.buildFilters(
          product.id,
          query,
        ),
      );

    return {
      variants: result.variants.map(
        (variant) =>
          this.toPublicVariant(variant),
      ),

      pagination: createPaginationMetadata(
        query.page,
        query.limit,
        result.totalItems,
      ),
    };
  }

  async findById(publicId: string) {
    const variant =
      await this.ensureVariantExists(publicId);

    return this.toPublicVariant(variant);
  }

  async create(
    productPublicId: string,
    body: CreateProductVariantBody,
  ) {
    const product =
      await this.ensureProductExists(
        productPublicId,
      );

    if (product.status === "ARCHIVED") {
      throw new AppError(
        "Não é possível adicionar variantes a um produto arquivado.",
        422,
        "ARCHIVED_PRODUCT_CANNOT_RECEIVE_VARIANTS",
      );
    }

    const sku = this.normalizeSku(body.sku);

    await this.ensureSkuAvailable(sku);

    const color =
      this.normalizeOptionalText(body.color) ??
      null;

    const size =
      this.normalizeOptionalText(body.size) ??
      null;

    await this.ensureCombinationAvailable(
      product.id,
      color,
      size,
    );

    const priceInCents =
      body.priceInCents;

    const compareAtPriceInCents =
      body.compareAtPriceInCents ?? null;

    this.validatePrices(
      priceInCents,
      compareAtPriceInCents,
    );

    const stock = body.stock ?? 0;
    const reservedStock =
      body.reservedStock ?? 0;

    if (reservedStock > stock) {
      throw new AppError(
        "O estoque reservado não pode ser maior que o estoque total.",
        422,
        "RESERVED_STOCK_EXCEEDS_STOCK",
      );
    }

    const data: CreateProductVariantData = {
      productId: product.id,
      sku,
      color: color ?? undefined,
      size: size ?? undefined,
      priceInCents,
      compareAtPriceInCents,
      costInCents:
        body.costInCents ?? null,
      stock,
      reservedStock,
      lowStockThreshold:
        body.lowStockThreshold ?? 5,
      barcode:
        this.normalizeOptionalText(
          body.barcode,
        ) ?? null,
      weightInGrams:
        body.weightInGrams ?? null,
      height: body.height ?? null,
      width: body.width ?? null,
      length: body.length ?? null,
      isActive: body.isActive ?? true,
    };

    const variant =
      await this.repository.create(data);

    return this.toPublicVariant(variant);
  }

  async update(
    publicId: string,
    body: UpdateProductVariantBody,
  ) {
    const currentVariant =
      await this.ensureVariantExists(publicId);

    const data: UpdateProductVariantData = {};

    if (body.sku !== undefined) {
      const sku =
        this.normalizeSku(body.sku);

      if (sku !== currentVariant.sku) {
        await this.ensureSkuAvailable(
          sku,
          currentVariant.id,
        );
      }

      data.sku = sku;
    }

    const color =
      body.color !== undefined
        ? this.normalizeOptionalText(
            body.color,
          ) ?? null
        : currentVariant.color;

    const size =
      body.size !== undefined
        ? this.normalizeOptionalText(
            body.size,
          ) ?? null
        : currentVariant.size;

    if (
      body.color !== undefined ||
      body.size !== undefined
    ) {
      await this.ensureCombinationAvailable(
        currentVariant.productId,
        color,
        size,
        currentVariant.id,
      );
    }

    if (body.color !== undefined) {
      data.color = color;
    }

    if (body.size !== undefined) {
      data.size = size;
    }

    const effectivePrice =
      body.priceInCents ??
      currentVariant.priceInCents;

    const effectiveCompareAtPrice =
      body.compareAtPriceInCents !==
      undefined
        ? body.compareAtPriceInCents
        : currentVariant.compareAtPriceInCents;

    this.validatePrices(
      effectivePrice,
      effectiveCompareAtPrice,
    );

    if (body.priceInCents !== undefined) {
      data.priceInCents =
        body.priceInCents;
    }

    if (
      body.compareAtPriceInCents !==
      undefined
    ) {
      data.compareAtPriceInCents =
        body.compareAtPriceInCents;
    }

    if (body.costInCents !== undefined) {
      data.costInCents =
        body.costInCents;
    }

    if (
      body.lowStockThreshold !== undefined
    ) {
      data.lowStockThreshold =
        body.lowStockThreshold;
    }

    if (body.barcode !== undefined) {
      data.barcode =
        this.normalizeOptionalText(
          body.barcode,
        ) ?? null;
    }

    if (
      body.weightInGrams !== undefined
    ) {
      data.weightInGrams =
        body.weightInGrams;
    }

    if (body.height !== undefined) {
      data.height = body.height;
    }

    if (body.width !== undefined) {
      data.width = body.width;
    }

    if (body.length !== undefined) {
      data.length = body.length;
    }

    if (body.isActive !== undefined) {
      if (
        body.isActive &&
        currentVariant.product.status ===
          "ARCHIVED"
      ) {
        throw new AppError(
          "Não é possível ativar uma variante de um produto arquivado.",
          422,
          "ARCHIVED_PRODUCT_VARIANT_CANNOT_BE_ACTIVATED",
        );
      }

      data.isActive = body.isActive;
    }

    const variant =
      await this.repository.update(
        currentVariant.id,
        data,
      );

    return this.toPublicVariant(variant);
  }

  async updateStatus(
    publicId: string,
    body: UpdateProductVariantStatusBody,
  ) {
    const currentVariant =
      await this.ensureVariantExists(publicId);

    if (
      currentVariant.isActive ===
      body.isActive
    ) {
      return this.toPublicVariant(
        currentVariant,
      );
    }

    if (
      body.isActive &&
      currentVariant.product.status ===
        "ARCHIVED"
    ) {
      throw new AppError(
        "Não é possível ativar uma variante de um produto arquivado.",
        422,
        "ARCHIVED_PRODUCT_VARIANT_CANNOT_BE_ACTIVATED",
      );
    }

    const variant =
      await this.repository.updateStatus(
        currentVariant.id,
        body.isActive,
      );

    return this.toPublicVariant(variant);
  }

  async delete(publicId: string) {
    const variant =
      await this.ensureVariantExists(publicId);

    const hasOrderItems =
      await this.repository.hasOrderItems(
        variant.id,
      );

    if (hasOrderItems) {
      throw new AppError(
        "Esta variante não pode ser excluída porque já está vinculada a pedidos.",
        409,
        "PRODUCT_VARIANT_HAS_ORDER_ITEMS",
      );
    }

    await this.repository.delete(
      variant.id,
    );
  }

  private toPublicVariant(variant: {
    publicId: string;
    productId: string;
    sku: string;
    color: string | null;
    size: string | null;
    priceInCents: number;
    compareAtPriceInCents: number | null;
    costInCents: number | null;
    stock: number;
    reservedStock: number;
    lowStockThreshold: number;
    barcode: string | null;
    weightInGrams: number | null;
    height: number | null;
    width: number | null;
    length: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    product: {
      publicId: string;
      name: string;
      slug: string;
      status:
        | "DRAFT"
        | "ACTIVE"
        | "INACTIVE"
        | "ARCHIVED";
    };
  }) {
    return {
      id: variant.publicId,

      product: {
        id: variant.product.publicId,
        name: variant.product.name,
        slug: variant.product.slug,
        status: variant.product.status,
      },

      sku: variant.sku,
      color: variant.color,
      size: variant.size,

      priceInCents:
        variant.priceInCents,

      compareAtPriceInCents:
        variant.compareAtPriceInCents,

      costInCents:
        variant.costInCents,

      stock: variant.stock,

      reservedStock:
        variant.reservedStock,

      availableStock:
        Math.max(
          variant.stock -
            variant.reservedStock,
          0,
        ),

      lowStockThreshold:
        variant.lowStockThreshold,

      isLowStock:
        variant.stock -
          variant.reservedStock <=
        variant.lowStockThreshold,

      barcode: variant.barcode,

      weightInGrams:
        variant.weightInGrams,

      dimensions: {
        height: variant.height,
        width: variant.width,
        length: variant.length,
      },

      isActive: variant.isActive,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }
}