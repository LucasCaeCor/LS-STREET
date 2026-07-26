import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  FavoriteProductParams,
  ListFavoritesQuery,
} from "./favorite.schema";

import {
  FavoriteService,
} from "./favorite.service";

export class FavoriteController {
  constructor(
    private readonly service:
      FavoriteService,
  ) {}

  add = async (
    request: FastifyRequest<{
      Params:
        FavoriteProductParams;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.add(
        request.user.sub,
        request.params.productId,
      );

    return reply
      .status(
        result.alreadyFavorited
          ? 200
          : 201,
      )
      .send({
        success: true,

        message:
          result.alreadyFavorited
            ? "Produto já estava nos favoritos."
            : "Produto adicionado aos favoritos.",

        data: result,
      });
  };

  remove = async (
    request: FastifyRequest<{
      Params:
        FavoriteProductParams;
    }>,
    reply: FastifyReply,
  ) => {
    await this.service.remove(
      request.user.sub,
      request.params.productId,
    );

    return reply
      .status(204)
      .send();
  };

  list = async (
    request: FastifyRequest<{
      Querystring:
        ListFavoritesQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.list(
        request.user.sub,
        request.query,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Favoritos listados com sucesso.",

        data:
          result.favorites,

        pagination:
          result.pagination,
      });
  };
}