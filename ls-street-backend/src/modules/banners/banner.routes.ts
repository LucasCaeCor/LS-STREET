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
  BannerController,
} from "./banner.controller";

import {
  BannerRepository,
} from "./banner.repository";

import {
  bannerParamsSchema,
  createBannerSchema,
  listAdminBannersQuerySchema,
  listPublicBannersQuerySchema,
  updateBannerSchema,

  type BannerParams,
  type CreateBannerBody,
  type ListAdminBannersQuery,
  type ListPublicBannersQuery,
  type UpdateBannerBody,
} from "./banner.schema";

import {
  BannerService,
} from "./banner.service";

function createBannerController() {
  const repository =
    new BannerRepository(
      prisma,
    );

  const service =
    new BannerService(
      repository,
    );

  return new BannerController(
    service,
  );
}

export async function bannerRoutes(
  fastify: FastifyInstance,
) {
  const controller =
    createBannerController();

  fastify.get<{
    Querystring:
      ListPublicBannersQuery;
  }>(
    "/",
    {
      preHandler: [
        validate({
          query:
            listPublicBannersQuerySchema,
        }),
      ],
    },

    controller.listPublic,
  );
}

export async function adminBannerRoutes(
  fastify: FastifyInstance,
) {
  const controller =
    createBannerController();

  fastify.post<{
    Body: CreateBannerBody;
  }>(
    "/",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          body:
            createBannerSchema,
        }),
      ],
    },

    controller.create,
  );

  fastify.get<{
    Querystring:
      ListAdminBannersQuery;
  }>(
    "/",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          query:
            listAdminBannersQuerySchema,
        }),
      ],
    },

    controller.listAdmin,
  );

  fastify.get<{
    Params: BannerParams;
  }>(
    "/:bannerId",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            bannerParamsSchema,
        }),
      ],
    },

    controller.findById,
  );

  fastify.patch<{
    Params: BannerParams;
    Body: UpdateBannerBody;
  }>(
    "/:bannerId",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            bannerParamsSchema,

          body:
            updateBannerSchema,
        }),
      ],
    },

    controller.update,
  );

  fastify.delete<{
    Params: BannerParams;
  }>(
    "/:bannerId",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            bannerParamsSchema,
        }),
      ],
    },

    controller.delete,
  );
}