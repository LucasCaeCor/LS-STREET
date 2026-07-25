import type { ProductStatus } from "@prisma/client";

import {
  ProductRepository,
  type CreateProductData,
  type ListProductsFilters,
  type UpdateProductData,
} from "./product.repository";

import type {
  CreateProductBody,
  ListProductsQuery,
  UpdateProductBody,
  UpdateProductFeaturedBody,
  UpdateProductStatusBody,
} from "./product.schema";

interface ServiceErrorOptions {
  statusCode: number;
  code: string;
}

export class ProductServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    options: ServiceErrorOptions,
  ) {
    super(message);

    this.name = "ProductServiceError";
    this.statusCode = options.statusCode;
    this.code = options.code;
  }
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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

function buildPagination(
  page: number,
  limit: number,
  totalItems: number,
) {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
  ) {}

  private async ensureCategoryExists(
    categoryId: string,
  ) {
    const category =
      await this.repository.categoryExists(categoryId);

    if (!category) {
      throw new ProductServiceError(
        "Categoria não encontrada.",
        {
          statusCode: 404,
          code: "CATEGORY_NOT_FOUND",
        },
      );
    }

    return category;
  }

  private async ensureSlugAvailable(
    slug: string,
    excludeProductId?: string,
  ) {
    const exists = await this.repository.slugExists(
      slug,
      excludeProductId,
    );

    if (exists) {
      throw new ProductServiceError(
        "Já existe um produto com esse slug.",
        {
          statusCode: 409,
          code: "PRODUCT_SLUG_ALREADY_EXISTS",
        },
      );
    }
  }

  private async ensureProductExists(id: string) {
    const product = await this.repository.findById(id);

    if (!product) {
      throw new ProductServiceError(
        "Produto não encontrado.",
        {
          statusCode: 404,
          code: "PRODUCT_NOT_FOUND",
        },
      );
    }

    return product;
  }

  private buildFilters(
    query: ListProductsQuery,
  ): ListProductsFilters {
    return {
      page: query.page,
      limit: query.limit,
      search: query.search,
      categoryId: query.categoryId,
      categorySlug: query.categorySlug,
      brand: query.brand,
      status: query.status,
      isFeatured: query.isFeatured,
      minPriceInCents: query.minPriceInCents,
      maxPriceInCents: query.maxPriceInCents,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };
  }

  async listPublic(query: ListProductsQuery) {
    const filters = this.buildFilters(query);

    const { status: _status, ...publicFilters } =
      filters;

    const result =
      await this.repository.findPublic(publicFilters);

    return {
      products: result.products,
      pagination: buildPagination(
        query.page,
        query.limit,
        result.totalItems,
      ),
    };
  }

  async listAdmin(query: ListProductsQuery) {
    const result = await this.repository.findAdmin(
      this.buildFilters(query),
    );

    return {
      products: result.products,
      pagination: buildPagination(
        query.page,
        query.limit,
        result.totalItems,
      ),
    };
  }

  async findPublicBySlug(slug: string) {
    const product =
      await this.repository.findPublicBySlug(slug);

    if (!product) {
      throw new ProductServiceError(
        "Produto não encontrado.",
        {
          statusCode: 404,
          code: "PRODUCT_NOT_FOUND",
        },
      );
    }

    return product;
  }

  async findById(id: string) {
    return this.ensureProductExists(id);
  }

  async create(body: CreateProductBody) {
    const category =
      await this.ensureCategoryExists(body.categoryId);

    const slug = normalizeSlug(
      body.slug ?? body.name,
    );

    if (!slug) {
      throw new ProductServiceError(
        "Não foi possível gerar um slug válido.",
        {
          statusCode: 422,
          code: "INVALID_PRODUCT_SLUG",
        },
      );
    }

    await this.ensureSlugAvailable(slug);

    const status = body.status ?? "DRAFT";

    if (status === "ACTIVE" && !category.isActive) {
      throw new ProductServiceError(
        "Não é possível ativar um produto de uma categoria inativa.",
        {
          statusCode: 422,
          code: "INACTIVE_PRODUCT_CATEGORY",
        },
      );
    }

    const data: CreateProductData = {
      name: body.name.trim(),
      slug,
      description:
        normalizeOptionalText(body.description) ??
        undefined,
      shortDescription:
        normalizeOptionalText(
          body.shortDescription,
        ) ?? undefined,
      brand:
        normalizeOptionalText(body.brand) ??
        undefined,
      status,
      isFeatured: body.isFeatured ?? false,
      seoTitle:
        normalizeOptionalText(body.seoTitle) ??
        undefined,
      seoDescription:
        normalizeOptionalText(
          body.seoDescription,
        ) ?? undefined,
      categoryId: body.categoryId,
    };

    return this.repository.create(data);
  }

  async update(
    id: string,
    body: UpdateProductBody,
  ) {
    const product =
      await this.ensureProductExists(id);

    const data: UpdateProductData = {};

    if (body.name !== undefined) {
      data.name = body.name.trim();
    }

    if (body.slug !== undefined) {
      const slug = normalizeSlug(body.slug);

      if (!slug) {
        throw new ProductServiceError(
          "Informe um slug válido.",
          {
            statusCode: 422,
            code: "INVALID_PRODUCT_SLUG",
          },
        );
      }

      await this.ensureSlugAvailable(slug, id);
      data.slug = slug;
    } else if (
      body.name !== undefined &&
      product.slug === normalizeSlug(product.name)
    ) {
      const generatedSlug = normalizeSlug(body.name);

      await this.ensureSlugAvailable(
        generatedSlug,
        id,
      );

      data.slug = generatedSlug;
    }

    if (body.description !== undefined) {
      data.description = normalizeOptionalText(
        body.description,
      );
    }

    if (body.shortDescription !== undefined) {
      data.shortDescription =
        normalizeOptionalText(
          body.shortDescription,
        );
    }

    if (body.brand !== undefined) {
      data.brand = normalizeOptionalText(
        body.brand,
      );
    }

    if (body.seoTitle !== undefined) {
      data.seoTitle = normalizeOptionalText(
        body.seoTitle,
      );
    }

    if (body.seoDescription !== undefined) {
      data.seoDescription =
        normalizeOptionalText(
          body.seoDescription,
        );
    }

    if (body.categoryId !== undefined) {
      const category =
        await this.ensureCategoryExists(
          body.categoryId,
        );

      if (
        product.status === "ACTIVE" &&
        !category.isActive
      ) {
        throw new ProductServiceError(
          "Um produto ativo não pode pertencer a uma categoria inativa.",
          {
            statusCode: 422,
            code: "INACTIVE_PRODUCT_CATEGORY",
          },
        );
      }

      data.categoryId = body.categoryId;
    }

    return this.repository.update(id, data);
  }

  async updateStatus(
    id: string,
    body: UpdateProductStatusBody,
  ) {
    const product =
      await this.ensureProductExists(id);

    if (body.status === "ACTIVE") {
      if (!product.category.isActive) {
        throw new ProductServiceError(
          "Não é possível ativar um produto de uma categoria inativa.",
          {
            statusCode: 422,
            code: "INACTIVE_PRODUCT_CATEGORY",
          },
        );
      }

      const hasActiveVariant =
        product.variants.some(
          (variant) => variant.isActive,
        );

      if (!hasActiveVariant) {
        throw new ProductServiceError(
          "Adicione pelo menos uma variante ativa antes de ativar o produto.",
          {
            statusCode: 422,
            code: "PRODUCT_WITHOUT_ACTIVE_VARIANT",
          },
        );
      }
    }

    return this.repository.updateStatus(
      id,
      body.status as ProductStatus,
    );
  }

  async updateFeatured(
    id: string,
    body: UpdateProductFeaturedBody,
  ) {
    const product =
      await this.ensureProductExists(id);

    if (
      body.isFeatured &&
      product.status !== "ACTIVE"
    ) {
      throw new ProductServiceError(
        "Somente produtos ativos podem receber destaque.",
        {
          statusCode: 422,
          code: "INACTIVE_PRODUCT_CANNOT_BE_FEATURED",
        },
      );
    }

    return this.repository.updateFeatured(
      id,
      body.isFeatured,
    );
  }

  async delete(id: string) {
    await this.ensureProductExists(id);

    const hasOrderItems =
      await this.repository.hasOrderItems(id);

    if (hasOrderItems) {
      throw new ProductServiceError(
        "Este produto não pode ser excluído porque já está vinculado a pedidos.",
        {
          statusCode: 409,
          code: "PRODUCT_HAS_ORDER_ITEMS",
        },
      );
    }

    await this.repository.delete(id);
  }
}