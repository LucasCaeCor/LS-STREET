import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  BannerService,
} from "./banner.service";

import type {
  BannerParams,
  CreateBannerBody,
  ListAdminBannersQuery,
  ListPublicBannersQuery,
  UpdateBannerBody,
} from "./banner.schema";

export class BannerController {
  constructor(
    private readonly service:
      BannerService,
  ) {}

  create = async (
    request: FastifyRequest<{
      Body: CreateBannerBody;
    }>,
    reply: FastifyReply,
  ) => {
    const banner =
      await this.service.create(
        request.body,
      );

    return reply
      .status(201)
      .send({
        success: true,

        message:
          "Banner criado com sucesso.",

        data: {
          banner,
        },
      });
  };

  listPublic = async (
    request: FastifyRequest<{
      Querystring:
        ListPublicBannersQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const banners =
      await this.service
        .listPublic(
          request.query,
        );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Banners listados com sucesso.",

        data: {
          banners,
        },
      });
  };

  listAdmin = async (
    request: FastifyRequest<{
      Querystring:
        ListAdminBannersQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service
        .listAdmin(
          request.query,
        );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Banners administrativos listados com sucesso.",

        data:
          result.banners,

        pagination:
          result.pagination,
      });
  };

  findById = async (
    request: FastifyRequest<{
      Params: BannerParams;
    }>,
    reply: FastifyReply,
  ) => {
    const banner =
      await this.service
        .findById(
          request.params.bannerId,
        );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Banner encontrado com sucesso.",

        data: {
          banner,
        },
      });
  };

  update = async (
    request: FastifyRequest<{
      Params: BannerParams;
      Body: UpdateBannerBody;
    }>,
    reply: FastifyReply,
  ) => {
    const banner =
      await this.service.update(
        request.params.bannerId,
        request.body,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Banner atualizado com sucesso.",

        data: {
          banner,
        },
      });
  };

  delete = async (
    request: FastifyRequest<{
      Params: BannerParams;
    }>,
    reply: FastifyReply,
  ) => {
    await this.service.delete(
      request.params.bannerId,
    );

    return reply
      .status(204)
      .send();
  };
}