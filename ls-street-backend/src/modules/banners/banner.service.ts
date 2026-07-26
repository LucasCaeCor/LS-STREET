import type {
  Prisma,
} from "@prisma/client";

import {
  AppError,
} from "../../core/errors/app-error";

import {
  createPaginationMetadata,
} from "../../core/pagination/pagination";

import {
  cloudinaryService,
} from "../../services/cloudinary/cloudinary.service";

import {
  BannerRepository,
} from "./banner.repository";

import type {
  CreateBannerBody,
  ListAdminBannersQuery,
  ListPublicBannersQuery,
  UpdateBannerBody,
} from "./banner.schema";

function validateBannerPeriod(
  startsAt: Date | null,
  endsAt: Date | null,
) {
  if (
    startsAt &&
    endsAt &&
    startsAt >= endsAt
  ) {
    throw new AppError(
      "O encerramento deve ser posterior ao início.",
      422,
      "INVALID_BANNER_PERIOD",
    );
  }
}

export class BannerService {
  constructor(
    private readonly repository:
      BannerRepository,
  ) {}

  async create(
    body: CreateBannerBody,
  ) {
    validateBannerPeriod(
      body.startsAt ?? null,
      body.endsAt ?? null,
    );

    return this.repository.create({
      title: body.title,

      subtitle:
        body.subtitle,

      imageUrl:
        body.imageUrl,

      mobileImageUrl:
        body.mobileImageUrl,

      publicId:
        body.publicId,

      link:
        body.link,

      buttonText:
        body.buttonText,

      position:
        body.position,

      sortOrder:
        body.sortOrder,

      active:
        body.active,

      startsAt:
        body.startsAt,

      endsAt:
        body.endsAt,
    });
  }

  async findById(
    bannerId: string,
  ) {
    const banner =
      await this.repository
        .findById(bannerId);

    if (!banner) {
      throw new AppError(
        "Banner não encontrado.",
        404,
        "BANNER_NOT_FOUND",
      );
    }

    return banner;
  }

  async listAdmin(
    query:
      ListAdminBannersQuery,
  ) {
    const result =
      await this.repository
        .listAdmin({
          page: query.page,
          limit: query.limit,

          search:
            query.search,

          position:
            query.position,

          active:
            query.active,

          sortOrder:
            query.sortOrder,
        });

    return {
      banners:
        result.banners,

      pagination:
        createPaginationMetadata(
          query.page,
          query.limit,
          result.totalItems,
        ),
    };
  }

  async listPublic(
    query:
      ListPublicBannersQuery,
  ) {
    return this.repository
      .listPublic(
        query.position,
      );
  }

  async update(
    bannerId: string,
    body: UpdateBannerBody,
  ) {
    const currentBanner =
      await this.findById(
        bannerId,
      );

    const startsAt =
      body.startsAt === undefined
        ? currentBanner.startsAt
        : body.startsAt;

    const endsAt =
      body.endsAt === undefined
        ? currentBanner.endsAt
        : body.endsAt;

    validateBannerPeriod(
      startsAt,
      endsAt,
    );

    const data:
      Prisma.BannerUpdateInput =
      {};

    if (
      body.title !== undefined
    ) {
      data.title = body.title;
    }

    if (
      body.subtitle !==
      undefined
    ) {
      data.subtitle =
        body.subtitle;
    }

    if (
      body.imageUrl !==
      undefined
    ) {
      data.imageUrl =
        body.imageUrl;
    }

    if (
      body.mobileImageUrl !==
      undefined
    ) {
      data.mobileImageUrl =
        body.mobileImageUrl;
    }

    if (
      body.publicId !==
      undefined
    ) {
      data.publicId =
        body.publicId;
    }

    if (
      body.link !== undefined
    ) {
      data.link = body.link;
    }

    if (
      body.buttonText !==
      undefined
    ) {
      data.buttonText =
        body.buttonText;
    }

    if (
      body.position !==
      undefined
    ) {
      data.position =
        body.position;
    }

    if (
      body.sortOrder !==
      undefined
    ) {
      data.sortOrder =
        body.sortOrder;
    }

    if (
      body.active !==
      undefined
    ) {
      data.active =
        body.active;
    }

    if (
      body.startsAt !==
      undefined
    ) {
      data.startsAt =
        body.startsAt;
    }

    if (
      body.endsAt !== undefined
    ) {
      data.endsAt =
        body.endsAt;
    }

    const updatedBanner =
      await this.repository
        .update(
          bannerId,
          data,
        );

    if (
      body.publicId &&
      currentBanner.publicId &&
      body.publicId !==
        currentBanner.publicId
    ) {
      await cloudinaryService
        .deleteImage(
          currentBanner.publicId,
        )
        .catch(() => undefined);
    }

    return updatedBanner;
  }

  async delete(
    bannerId: string,
  ) {
    const banner =
      await this.findById(
        bannerId,
      );

    await this.repository.delete(
      bannerId,
    );

    if (banner.publicId) {
      await cloudinaryService
        .deleteImage(
          banner.publicId,
        )
        .catch(() => undefined);
    }
  }
}