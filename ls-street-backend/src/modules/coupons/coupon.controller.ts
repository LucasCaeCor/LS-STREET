import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  CouponParams,
  CreateCouponBody,
  ListCouponsQuery,
  UpdateCouponBody,
  ValidateCouponBody,
} from "./coupon.schema";

import {
  CouponService,
} from "./coupon.service";

export class CouponController {
  constructor(
    private readonly service:
      CouponService,
  ) {}

  create = async (
    request: FastifyRequest<{
      Body: CreateCouponBody;
    }>,
    reply: FastifyReply,
  ) => {
    const coupon =
      await this.service.create(
        request.body,
      );

    return reply
      .status(201)
      .send({
        success: true,

        message:
          "Cupom criado com sucesso.",

        data: {
          coupon,
        },
      });
  };

  list = async (
    request: FastifyRequest<{
      Querystring:
        ListCouponsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.list(
        request.query,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Cupons listados com sucesso.",

        data: result.coupons,

        pagination:
          result.pagination,
      });
  };

  findById = async (
    request: FastifyRequest<{
      Params: CouponParams;
    }>,
    reply: FastifyReply,
  ) => {
    const coupon =
      await this.service.findById(
        request.params.couponId,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Cupom encontrado com sucesso.",

        data: {
          coupon,
        },
      });
  };

  update = async (
    request: FastifyRequest<{
      Params: CouponParams;
      Body: UpdateCouponBody;
    }>,
    reply: FastifyReply,
  ) => {
    const coupon =
      await this.service.update(
        request.params.couponId,
        request.body,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Cupom atualizado com sucesso.",

        data: {
          coupon,
        },
      });
  };

  validate = async (
    request: FastifyRequest<{
      Body: ValidateCouponBody;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.validate(
        request.user.sub,
        request.body,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Cupom validado com sucesso.",

        data: result,
      });
  };
}