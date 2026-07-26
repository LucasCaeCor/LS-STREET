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
  CouponController,
} from "./coupon.controller";

import {
  CouponRepository,
} from "./coupon.repository";

import {
  couponParamsSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,

  type CouponParams,
  type CreateCouponBody,
  type ListCouponsQuery,
  type UpdateCouponBody,
  type ValidateCouponBody,
} from "./coupon.schema";

import {
  CouponService,
} from "./coupon.service";

function createCouponController() {
  const repository =
    new CouponRepository(prisma);

  const service =
    new CouponService(
      repository,
    );

  return new CouponController(
    service,
  );
}

export async function couponRoutes(
  fastify: FastifyInstance,
) {
  const controller =
    createCouponController();

  fastify.post<{
    Body: ValidateCouponBody;
  }>(
    "/validate",
    {
      preHandler: [
        fastify.authenticate,

        validate({
          body:
            validateCouponSchema,
        }),
      ],
    },

    controller.validate,
  );
}

export async function adminCouponRoutes(
  fastify: FastifyInstance,
) {
  const controller =
    createCouponController();

  fastify.post<{
    Body: CreateCouponBody;
  }>(
    "/",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          body:
            createCouponSchema,
        }),
      ],
    },

    controller.create,
  );

  fastify.get<{
    Querystring:
      ListCouponsQuery;
  }>(
    "/",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          query:
            listCouponsQuerySchema,
        }),
      ],
    },

    controller.list,
  );

  fastify.get<{
    Params: CouponParams;
  }>(
    "/:couponId",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            couponParamsSchema,
        }),
      ],
    },

    controller.findById,
  );

  fastify.patch<{
    Params: CouponParams;
    Body: UpdateCouponBody;
  }>(
    "/:couponId",
    {
      preHandler: [
        fastify.requireAdmin,

        validate({
          params:
            couponParamsSchema,

          body:
            updateCouponSchema,
        }),
      ],
    },

    controller.update,
  );
}