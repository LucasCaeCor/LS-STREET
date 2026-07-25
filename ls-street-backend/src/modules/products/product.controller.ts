import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  CreateProductBody,
  ListProductsQuery,
  ProductParams,
  ProductSlugParams,
  UpdateProductBody,
  UpdateProductFeaturedBody,
  UpdateProductStatusBody,
} from "./product.schema";

import { ProductService } from "./product.service";

export class ProductController {
  constructor(
    private readonly service: ProductService,
  ) {}

  listPublic = async (
    request: FastifyRequest<{
      Querystring: ListProductsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result = await this.service.listPublic(
      request.query,
    );

    return reply.status(200).send({
      success: true,
      message: "Produtos listados com sucesso.",
      data: result.products,
      pagination: result.pagination,
    });
  };

  listAdmin = async (
    request: FastifyRequest<{
      Querystring: ListProductsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result = await this.service.listAdmin(
      request.query,
    );

    return reply.status(200).send({
      success: true,
      message: "Produtos listados com sucesso.",
      data: result.products,
      pagination: result.pagination,
    });
  };

  findPublicBySlug = async (
    request: FastifyRequest<{
      Params: ProductSlugParams;
    }>,
    reply: FastifyReply,
  ) => {
    const product =
      await this.service.findPublicBySlug(
        request.params.slug,
      );

    return reply.status(200).send({
      success: true,
      message: "Produto encontrado com sucesso.",
      data: {
        product,
      },
    });
  };

  findById = async (
    request: FastifyRequest<{
      Params: ProductParams;
    }>,
    reply: FastifyReply,
  ) => {
    const product = await this.service.findById(
      request.params.id,
    );

    return reply.status(200).send({
      success: true,
      message: "Produto encontrado com sucesso.",
      data: {
        product,
      },
    });
  };

  create = async (
    request: FastifyRequest<{
      Body: CreateProductBody;
    }>,
    reply: FastifyReply,
  ) => {
    const product = await this.service.create(
      request.body,
    );

    return reply.status(201).send({
      success: true,
      message: "Produto criado com sucesso.",
      data: {
        product,
      },
    });
  };

  update = async (
    request: FastifyRequest<{
      Params: ProductParams;
      Body: UpdateProductBody;
    }>,
    reply: FastifyReply,
  ) => {
    const product = await this.service.update(
      request.params.id,
      request.body,
    );

    return reply.status(200).send({
      success: true,
      message: "Produto atualizado com sucesso.",
      data: {
        product,
      },
    });
  };

  updateStatus = async (
    request: FastifyRequest<{
      Params: ProductParams;
      Body: UpdateProductStatusBody;
    }>,
    reply: FastifyReply,
  ) => {
    const product =
      await this.service.updateStatus(
        request.params.id,
        request.body,
      );

    return reply.status(200).send({
      success: true,
      message:
        "Status do produto atualizado com sucesso.",
      data: {
        product,
      },
    });
  };

  updateFeatured = async (
    request: FastifyRequest<{
      Params: ProductParams;
      Body: UpdateProductFeaturedBody;
    }>,
    reply: FastifyReply,
  ) => {
    const product =
      await this.service.updateFeatured(
        request.params.id,
        request.body,
      );

    return reply.status(200).send({
      success: true,
      message:
        "Destaque do produto atualizado com sucesso.",
      data: {
        product,
      },
    });
  };

  delete = async (
    request: FastifyRequest<{
      Params: ProductParams;
    }>,
    reply: FastifyReply,
  ) => {
    await this.service.delete(request.params.id);

    return reply.status(200).send({
      success: true,
      message: "Produto excluído com sucesso.",
    });
  };
}