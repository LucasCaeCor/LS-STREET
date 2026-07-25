import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  CreateProductVariantBody,
  ListProductVariantsQuery,
  ProductVariantParams,
  ProductVariantProductParams,
  UpdateProductVariantBody,
  UpdateProductVariantStatusBody,
} from "./product-variant.schema";

import { ProductVariantService } from "./product-variant.service";

export class ProductVariantController {
  constructor(
    private readonly service: ProductVariantService,
  ) {}

  listByProduct = async (
    request: FastifyRequest<{
      Params: ProductVariantProductParams;
      Querystring: ListProductVariantsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.listByProduct(
        request.params.productId,
        request.query,
      );

    return reply.status(200).send({
      success: true,
      message:
        "Variantes listadas com sucesso.",
      data: result.variants,
      pagination: result.pagination,
    });
  };

  findById = async (
    request: FastifyRequest<{
      Params: ProductVariantParams;
    }>,
    reply: FastifyReply,
  ) => {
    const variant =
      await this.service.findById(
        request.params.id,
      );

    return reply.status(200).send({
      success: true,
      message:
        "Variante encontrada com sucesso.",
      data: {
        variant,
      },
    });
  };

  create = async (
    request: FastifyRequest<{
      Params: ProductVariantProductParams;
      Body: CreateProductVariantBody;
    }>,
    reply: FastifyReply,
  ) => {
    const variant =
      await this.service.create(
        request.params.productId,
        request.body,
      );

    return reply.status(201).send({
      success: true,
      message:
        "Variante criada com sucesso.",
      data: {
        variant,
      },
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: ProductVariantParams;
      Body: UpdateProductVariantBody;
    }>,
    reply: FastifyReply,
  ) => {
    const variant =
      await this.service.update(
        request.params.id,
        request.body,
      );

    return reply.status(200).send({
      success: true,
      message:
        "Variante atualizada com sucesso.",
      data: {
        variant,
      },
    });
  };

  updateStatus = async (
    request: FastifyRequest<{
      Params: ProductVariantParams;
      Body: UpdateProductVariantStatusBody;
    }>,
    reply: FastifyReply,
  ) => {
    const variant =
      await this.service.updateStatus(
        request.params.id,
        request.body,
      );

    return reply.status(200).send({
      success: true,
      message:
        "Status da variante atualizado com sucesso.",
      data: {
        variant,
      },
    });
  };

  delete = async (
    request: FastifyRequest<{
      Params: ProductVariantParams;
    }>,
    reply: FastifyReply,
  ) => {
    await this.service.delete(
      request.params.id,
    );

    return reply.status(200).send({
      success: true,
      message:
        "Variante excluída com sucesso.",
    });
  };
}