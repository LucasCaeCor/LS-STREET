import {
  createPaginationMetadata,
} from "../../core/pagination/pagination";

import {
  AdminFavoriteRepository,
} from "./admin-favorite.repository";

import type {
  ListAdminFavoritesQuery,
} from "./admin-favorite.schema";

export class AdminFavoriteService {
  constructor(
    private readonly repository:
      AdminFavoriteRepository,
  ) {}

  async list(
    query:
      ListAdminFavoritesQuery,
  ) {
    const result =
      await this.repository.list({
        page: query.page,
        limit: query.limit,

        search:
          query.search,

        sortOrder:
          query.sortOrder,
      });

    const favorites =
      result.favorites.map(
        (favorite) => ({
          id: favorite.id,

          createdAt:
            favorite.createdAt,

          customer:
            favorite.user,

          product: {
            publicId:
              favorite.product
                .publicId,

            name:
              favorite.product.name,

            slug:
              favorite.product.slug,

            brand:
              favorite.product.brand,

            status:
              favorite.product.status,

            image:
              favorite.product
                .images[0] ??
              null,
          },
        }),
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

  async summary() {
    return this.repository
      .summary();
  }
}