import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { AddressService } from "./address.service";

import {
  addressParamsSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./address.schema";

export class AddressController {
  constructor(
    private readonly service: AddressService,
  ) {}

  async list(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const addresses =
      await this.service.list(userId);

    return reply.status(200).send({
      success: true,
      data: {
        addresses,
      },
    });
  }

  async create(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const body = createAddressSchema.parse(
      request.body,
    );

    const address =
      await this.service.create(userId, body);

    return reply.status(201).send({
      success: true,
      message: "Endereço criado com sucesso.",
      data: {
        address,
      },
    });
  }

  async update(
    request: FastifyRequest<{
      Params: {
        addressId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const { addressId } =
      addressParamsSchema.parse(request.params);

    const body = updateAddressSchema.parse(
      request.body,
    );

    const address =
      await this.service.update(
        userId,
        addressId,
        body,
      );

    return reply.status(200).send({
      success: true,
      message: "Endereço atualizado com sucesso.",
      data: {
        address,
      },
    });
  }

  async setDefault(
    request: FastifyRequest<{
      Params: {
        addressId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const { addressId } =
      addressParamsSchema.parse(request.params);

    const address =
      await this.service.setDefault(
        userId,
        addressId,
      );

    return reply.status(200).send({
      success: true,
      message:
        "Endereço padrão atualizado com sucesso.",
      data: {
        address,
      },
    });
  }

  async delete(
    request: FastifyRequest<{
      Params: {
        addressId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const userId = request.user.sub;

    const { addressId } =
      addressParamsSchema.parse(request.params);

    await this.service.delete(
      userId,
      addressId,
    );

    return reply.status(200).send({
      success: true,
      message: "Endereço removido com sucesso.",
    });
  }
}