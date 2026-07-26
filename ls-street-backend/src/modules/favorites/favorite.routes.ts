import type {
  FastifyInstance,
} from "fastify";

import {
  prisma,
} from "../../database/prisma";

import {
  validate,
} from "../../plugins/validate";

import {
  FavoriteController,
} from "./favorite.controller";

import {
  FavoriteRepository,
} from "./favorite.repository";

import {
  favoriteProductParamsSchema,
  listFavoritesQuerySchema,

  type FavoriteProductParams,
  type ListFavoritesQuery,
} from "./favorite.schema";

import {
  FavoriteService,
} from "./favorite.service";

export async function favoriteRoutes(
  fastify: FastifyInstance,
) {
  const repository =
    new FavoriteRepository(
      prisma,
    );

  const service =
    new FavoriteService(
      repository,
    );

  const controller =
    new FavoriteController(
      service,
    );

  fastify.get<{
    Querystring:
      ListFavoritesQuery;
  }>(
    "/",
    {
      preHandler: [
        fastify.authenticate,

        validate({
          query:
            listFavoritesQuerySchema,
        }),
      ],
    },

    controller.list,
  );

  fastify.post<{
    Params:
      FavoriteProductParams;
  }>(
    "/:productId",
    {
      preHandler: [
        fastify.authenticate,

        validate({
          params:
            favoriteProductParamsSchema,
        }),
      ],
    },

    controller.add,
  );

  fastify.delete<{
    Params:
      FavoriteProductParams;
  }>(
    "/:productId",
    {
      preHandler: [
        fastify.authenticate,

        validate({
          params:
            favoriteProductParamsSchema,
        }),
      ],
    },

    controller.remove,
  );
}