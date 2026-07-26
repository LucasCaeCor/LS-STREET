import type {
  CouponType,
  Prisma,
} from "@prisma/client";

import {
  AppError,
} from "../../core/errors/app-error";

import {
  createPaginationMetadata,
} from "../../core/pagination/pagination";

import {
  CouponRepository,
} from "./coupon.repository";

import type {
  CreateCouponBody,
  ListCouponsQuery,
  UpdateCouponBody,
  ValidateCouponBody,
} from "./coupon.schema";

interface CouponRuleData {
  type: CouponType;
  value: number;

  startsAt: Date | null;
  expiresAt: Date | null;
}

function validateCouponRules(
  coupon: CouponRuleData,
) {
  if (
    coupon.type ===
      "PERCENTAGE" &&
    (
      coupon.value < 1 ||
      coupon.value > 100
    )
  ) {
    throw new AppError(
      "O desconto percentual deve estar entre 1 e 100.",
      422,
      "INVALID_COUPON_PERCENTAGE",
    );
  }

  if (
    coupon.type === "FIXED" &&
    coupon.value < 1
  ) {
    throw new AppError(
      "O valor do desconto fixo deve ser maior que zero.",
      422,
      "INVALID_COUPON_VALUE",
    );
  }

  if (
    coupon.type ===
      "FREE_SHIPPING" &&
    coupon.value !== 0
  ) {
    throw new AppError(
      "Cupons de frete grátis devem possuir valor zero.",
      422,
      "INVALID_FREE_SHIPPING_VALUE",
    );
  }

  if (
    coupon.startsAt &&
    coupon.expiresAt &&
    coupon.startsAt >=
      coupon.expiresAt
  ) {
    throw new AppError(
      "A data de expiração deve ser posterior à data de início.",
      422,
      "INVALID_COUPON_PERIOD",
    );
  }
}

export class CouponService {
  constructor(
    private readonly repository:
      CouponRepository,
  ) {}

  async create(
    body: CreateCouponBody,
  ) {
    const existingCoupon =
      await this.repository
        .findByCode(body.code);

    if (existingCoupon) {
      throw new AppError(
        "Já existe um cupom com esse código.",
        409,
        "COUPON_ALREADY_EXISTS",
      );
    }

    validateCouponRules({
      type: body.type,
      value: body.value,

      startsAt:
        body.startsAt ?? null,

      expiresAt:
        body.expiresAt ?? null,
    });

    return this.repository.create({
      code: body.code,

      description:
        body.description,

      type: body.type,
      value: body.value,

      minimumOrderInCents:
        body.minimumOrderInCents,

      maximumDiscountInCents:
        body
          .maximumDiscountInCents,

      usageLimit:
        body.usageLimit,

      usageLimitPerUser:
        body
          .usageLimitPerUser,

      startsAt:
        body.startsAt,

      expiresAt:
        body.expiresAt,

      active: body.active,
    });
  }

  async update(
    couponId: string,
    body: UpdateCouponBody,
  ) {
    const coupon =
      await this.repository
        .findById(couponId);

    if (!coupon) {
      throw new AppError(
        "Cupom não encontrado.",
        404,
        "COUPON_NOT_FOUND",
      );
    }

    if (
      body.code &&
      body.code !== coupon.code
    ) {
      const existingCoupon =
        await this.repository
          .findByCode(body.code);

      if (existingCoupon) {
        throw new AppError(
          "Já existe um cupom com esse código.",
          409,
          "COUPON_ALREADY_EXISTS",
        );
      }
    }

    const mergedType =
      body.type ?? coupon.type;

    const mergedValue =
      body.value ?? coupon.value;

    const mergedStartsAt =
      body.startsAt === undefined
        ? coupon.startsAt
        : body.startsAt;

    const mergedExpiresAt =
      body.expiresAt === undefined
        ? coupon.expiresAt
        : body.expiresAt;

    validateCouponRules({
      type: mergedType,
      value: mergedValue,

      startsAt:
        mergedStartsAt,

      expiresAt:
        mergedExpiresAt,
    });

    const data:
      Prisma.CouponUpdateInput =
      {};

    if (body.code !== undefined) {
      data.code = body.code;
    }

    if (
      body.description !==
      undefined
    ) {
      data.description =
        body.description;
    }

    if (body.type !== undefined) {
      data.type = body.type;
    }

    if (body.value !== undefined) {
      data.value = body.value;
    }

    if (
      body.minimumOrderInCents !==
      undefined
    ) {
      data.minimumOrderInCents =
        body.minimumOrderInCents;
    }

    if (
      body.maximumDiscountInCents !==
      undefined
    ) {
      data.maximumDiscountInCents =
        body.maximumDiscountInCents;
    }

    if (
      body.usageLimit !==
      undefined
    ) {
      data.usageLimit =
        body.usageLimit;
    }

    if (
      body.usageLimitPerUser !==
      undefined
    ) {
      data.usageLimitPerUser =
        body.usageLimitPerUser;
    }

    if (
      body.startsAt !== undefined
    ) {
      data.startsAt =
        body.startsAt;
    }

    if (
      body.expiresAt !== undefined
    ) {
      data.expiresAt =
        body.expiresAt;
    }

    if (
      body.active !== undefined
    ) {
      data.active =
        body.active;
    }

    return this.repository.update(
      couponId,
      data,
    );
  }

  async list(
    query: ListCouponsQuery,
  ) {
    const result =
      await this.repository.list({
        page: query.page,
        limit: query.limit,

        search: query.search,
        type: query.type,
        active: query.active,

        sortOrder:
          query.sortOrder,
      });

    return {
      coupons: result.coupons,

      pagination:
        createPaginationMetadata(
          query.page,
          query.limit,
          result.totalItems,
        ),
    };
  }

  async findById(
    couponId: string,
  ) {
    const coupon =
      await this.repository
        .findById(couponId);

    if (!coupon) {
      throw new AppError(
        "Cupom não encontrado.",
        404,
        "COUPON_NOT_FOUND",
      );
    }

    return coupon;
  }

  async validate(
    userId: string,
    body: ValidateCouponBody,
  ) {
    const coupon =
      await this.repository
        .findByCode(body.code);

    if (!coupon) {
      throw new AppError(
        "Cupom não encontrado.",
        404,
        "COUPON_NOT_FOUND",
      );
    }

    if (!coupon.active) {
      throw new AppError(
        "Este cupom está inativo.",
        422,
        "COUPON_INACTIVE",
      );
    }

    const now = new Date();

    if (
      coupon.startsAt &&
      coupon.startsAt > now
    ) {
      throw new AppError(
        "Este cupom ainda não está disponível.",
        422,
        "COUPON_NOT_STARTED",
      );
    }

    if (
      coupon.expiresAt &&
      coupon.expiresAt < now
    ) {
      throw new AppError(
        "Este cupom expirou.",
        422,
        "COUPON_EXPIRED",
      );
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usageCount >=
        coupon.usageLimit
    ) {
      throw new AppError(
        "O limite de uso deste cupom foi atingido.",
        422,
        "COUPON_USAGE_LIMIT_REACHED",
      );
    }

    if (
      body.subtotalInCents <
      coupon.minimumOrderInCents
    ) {
      throw new AppError(
        "O valor mínimo do pedido não foi atingido.",
        422,
        "COUPON_MINIMUM_ORDER_NOT_REACHED",
        {
          minimumOrderInCents:
            coupon.minimumOrderInCents,

          subtotalInCents:
            body.subtotalInCents,
        },
      );
    }

    if (
      coupon.usageLimitPerUser !==
      null
    ) {
      const userUsage =
        await this.repository
          .countUserUsage(
            coupon.id,
            userId,
          );

      if (
        userUsage >=
        coupon.usageLimitPerUser
      ) {
        throw new AppError(
          "Você já atingiu o limite de uso deste cupom.",
          422,
          "COUPON_USER_LIMIT_REACHED",
        );
      }
    }

    let discountInCents = 0;
    let freeShipping = false;

    if (
      coupon.type ===
      "PERCENTAGE"
    ) {
      discountInCents =
        Math.floor(
          body.subtotalInCents *
            coupon.value /
            100,
        );

      if (
        coupon
          .maximumDiscountInCents !==
        null
      ) {
        discountInCents =
          Math.min(
            discountInCents,
            coupon
              .maximumDiscountInCents,
          );
      }
    }

    if (coupon.type === "FIXED") {
      discountInCents =
        Math.min(
          coupon.value,
          body.subtotalInCents,
        );
    }

    if (
      coupon.type ===
      "FREE_SHIPPING"
    ) {
      freeShipping = true;
    }

    return {
      valid: true,

      coupon: {
        id: coupon.id,
        code: coupon.code,
        description:
          coupon.description,

        type: coupon.type,
        value: coupon.value,
      },

      subtotalInCents:
        body.subtotalInCents,

      discountInCents,

      totalAfterDiscountInCents:
        Math.max(
          0,
          body.subtotalInCents -
            discountInCents,
        ),

      freeShipping,
    };
  }
}