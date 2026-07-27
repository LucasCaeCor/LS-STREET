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
import {
  AppError,
} from "../../core/errors/app-error";

import {
  cloudinaryService,
} from "../../services/cloudinary/cloudinary.service";



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



fastify.post(
  "/upload",
  {
    preHandler: [
      fastify.requireAdmin,
    ],
  },
  async (
    request,
    reply,
  ) => {
    const file =
      await request.file();

    if (!file) {
      throw new AppError(
        "Selecione uma imagem.",
        400,
        "BANNER_IMAGE_REQUIRED",
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (
      !allowedTypes.includes(
        file.mimetype,
      )
    ) {
      throw new AppError(
        "Use uma imagem JPEG, PNG, WebP ou AVIF.",
        422,
        "INVALID_BANNER_IMAGE_TYPE",
      );
    }

    const buffer =
      await file.toBuffer();

    if (buffer.length === 0) {
      throw new AppError(
        "A imagem enviada está vazia.",
        422,
        "EMPTY_BANNER_IMAGE",
      );
    }

    const normalizedFilename =
      file.filename
        .replace(
          /\.[^/.]+$/,
          "",
        )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "-",
        )
        .slice(0, 80);

    const uploadedImage =
      await cloudinaryService
        .uploadImage(
          buffer,
          {
            folder:
              "ls-street/banners",

            filename:
              `${Date.now()}-${normalizedFilename || "banner"}`,
          },
        );

    return reply
      .status(201)
      .send({
        success: true,

        message:
          "Imagem enviada com sucesso.",

        data: uploadedImage,
      });
  },
);
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