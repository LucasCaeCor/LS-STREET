import {
  AppError,
} from "../../core/errors/app-error";

import {
  createPaginationMetadata,
} from "../../core/pagination/pagination";

import {
  FavoriteRepository,
} from "./favorite.repository";

import type {
  ListFavoritesQuery,
} from "./favorite.schema";

export class FavoriteService {
  constructor(
    private readonly repository:
      FavoriteRepository,
  ) {}

  async add(
    userId: string,
    productPublicId: string,
  ) {
    const product =
      await this.repository
        .findProductByPublicId(
          productPublicId,
        );

    if (!product) {
      throw new AppError(
        "Produto não encontrado.",
        404,
        "PRODUCT_NOT_FOUND",
      );
    }

    if (
      product.status !== "ACTIVE"
    ) {
      throw new AppError(
        "Este produto não está disponível.",
        422,
        "PRODUCT_NOT_AVAILABLE",
      );
    }

    const existingFavorite =
      await this.repository
        .findFavorite(
          userId,
          product.id,
        );

    if (existingFavorite) {
      return {
        favorite:
          existingFavorite,

        alreadyFavorited: true,
      };
    }

    const favorite =
      await this.repository.create(
        userId,
        product.id,
      );

    return {
      favorite,
      alreadyFavorited: false,
    };
  }

  async remove(
    userId: string,
    productPublicId: string,
  ) {
    const product =
      await this.repository
        .findProductByPublicId(
          productPublicId,
        );

    if (!product) {
      throw new AppError(
        "Produto não encontrado.",
        404,
        "PRODUCT_NOT_FOUND",
      );
    }

    const favorite =
      await this.repository
        .findFavorite(
          userId,
          product.id,
        );

    if (!favorite) {
      throw new AppError(
        "Este produto não está nos favoritos.",
        404,
        "FAVORITE_NOT_FOUND",
      );
    }

    await this.repository.delete(
      userId,
      product.id,
    );
  }

  async list(
    userId: string,
    query: ListFavoritesQuery,
  ) {
    const result =
      await this.repository.list({
        userId,

        page: query.page,
        limit: query.limit,

        sortOrder:
          query.sortOrder,
      });

    const favorites =
      result.favorites.map(
        (favorite) => {
          const variants =
            favorite.product
              .variants.map(
                (variant) => ({
                  ...variant,

                  availableStock:
                    Math.max(
                      0,
                      variant.stock -
                        variant
                          .reservedStock,
                    ),
                }),
              );

          const availableVariants =
            variants.filter(
              (variant) =>
                variant
                  .availableStock > 0,
            );

          const prices =
            variants.map(
              (variant) =>
                variant
                  .priceInCents,
            );

          return {
            id: favorite.id,
            createdAt:
              favorite.createdAt,

            product: {
              publicId:
                favorite.product
                  .publicId,

              name:
                favorite.product.name,

              slug:
                favorite.product.slug,

              shortDescription:
                favorite.product
                  .shortDescription,

              brand:
                favorite.product.brand,

              isFeatured:
                favorite.product
                  .isFeatured,

              image:
                favorite.product
                  .images[0] ?? null,

              category:
                favorite.product
                  .category,

              minimumPriceInCents:
                prices.length > 0
                  ? Math.min(
                      ...prices,
                    )
                  : null,

              available:
                availableVariants
                  .length > 0,

              variants,
            },
          };
        },
      );

    return {
      favorites,

      pagination:
        createPaginationMetadata(
          query.page,
          query.limit,
          result.totalItems,
        ),
    };
  }
}