import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  sendCreated,
  sendPaginated,
  sendSuccess,
} from "../../core/responses/api-response";

import type {
  CategoryParams,
  CategorySlugParams,
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
  UpdateCategoryStatusBody,
} from "./category.schema";
import { CategoryService } from "./category.service";

export class CategoryController {
  constructor(
    private readonly service: CategoryService,
  ) {}

  create = async (
    request: FastifyRequest<{
      Body: CreateCategoryBody;
    }>,
    reply: FastifyReply,
  ) => {
    const category = await this.service.create(
      request.body,
    );

    return sendCreated(
      reply,
      { category },
      "Categoria criada com sucesso.",
    );
  };

  listAdmin = async (
    request: FastifyRequest<{
      Querystring: ListCategoriesQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result = await this.service.listAdmin(
      request.query,
    );

    return sendPaginated(reply, {
      data: result.categories,
      pagination: result.pagination,
      message: "Categorias encontradas com sucesso.",
    });
  };

  listPublic = async (
    request: FastifyRequest<{
      Querystring: ListCategoriesQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result = await this.service.listPublic({
      page: request.query.page,
      limit: request.query.limit,
      search: request.query.search,
      sortOrder: request.query.sortOrder,
    });

    return sendPaginated(reply, {
      data: result.categories,
      pagination: result.pagination,
      message: "Categorias encontradas com sucesso.",
    });
  };

  findById = async (
    request: FastifyRequest<{
      Params: CategoryParams;
    }>,
    reply: FastifyReply,
  ) => {
    const category = await this.service.findById(
      request.params.id,
    );

    return sendSuccess(reply, {
      data: { category },
      message: "Categoria encontrada com sucesso.",
    });
  };

  findPublicBySlug = async (
    request: FastifyRequest<{
      Params: CategorySlugParams;
    }>,
    reply: FastifyReply,
  ) => {
    const category =
      await this.service.findPublicBySlug(
        request.params.slug,
      );

    return sendSuccess(reply, {
      data: { category },
      message: "Categoria encontrada com sucesso.",
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: CategoryParams;
      Body: UpdateCategoryBody;
    }>,
    reply: FastifyReply,
  ) => {
    const category = await this.service.update(
      request.params.id,
      request.body,
    );

    return sendSuccess(reply, {
      data: { category },
      message: "Categoria atualizada com sucesso.",
    });
  };

  updateStatus = async (
    request: FastifyRequest<{
      Params: CategoryParams;
      Body: UpdateCategoryStatusBody;
    }>,
    reply: FastifyReply,
  ) => {
    const category =
      await this.service.updateStatus(
        request.params.id,
        request.body.isActive,
      );

    return sendSuccess(reply, {
      data: { category },

      message: request.body.isActive
        ? "Categoria ativada com sucesso."
        : "Categoria desativada com sucesso.",
    });
  };
}