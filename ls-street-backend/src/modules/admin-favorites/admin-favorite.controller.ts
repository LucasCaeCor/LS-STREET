import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  sendPaginated,
  sendSuccess,
} from "../../core/responses/api-response";

import {
  AdminFavoriteService,
} from "./admin-favorite.service";

import type {
  ListAdminFavoritesQuery,
} from "./admin-favorite.schema";

export class AdminFavoriteController {
  constructor(
    private readonly service:
      AdminFavoriteService,
  ) {}

  list = async (
    request: FastifyRequest<{
      Querystring:
        ListAdminFavoritesQuery;
    }>,

    reply: FastifyReply,
  ) => {
    const result =
      await this.service.list(
        request.query,
      );

    return sendPaginated(
      reply,
      {
        data:
          result.favorites,

        pagination:
          result.pagination,

        message:
          "Favoritos encontrados com sucesso.",
      },
    );
  };

  summary = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const summary =
      await this.service
        .summary();

    return sendSuccess(
      reply,
      {
        data: {
          summary,
        },

        message:
          "Resumo de favoritos carregado com sucesso.",
      },
    );
  };
}