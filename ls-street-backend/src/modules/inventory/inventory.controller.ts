import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import type {
  AdjustInventoryBody,
  InventoryVariantParams,
  ListInventoryMovementsQuery,
} from "./inventory.schema";

import {
  InventoryService,
} from "./inventory.service";

export class InventoryController {
  constructor(
    private readonly service:
      InventoryService,
  ) {}

  adjust = async (
    request: FastifyRequest<{
      Params:
        InventoryVariantParams;

      Body:
        AdjustInventoryBody;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service.adjust(
        request.params.variantId,
        request.body,
      );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Estoque atualizado com sucesso.",

        data: result,
      });
  };

  listMovements = async (
    request: FastifyRequest<{
      Querystring:
        ListInventoryMovementsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const result =
      await this.service
        .listMovements(
          request.query,
        );

    return reply
      .status(200)
      .send({
        success: true,

        message:
          "Movimentações de estoque listadas com sucesso.",

        data:
          result.movements,

        pagination:
          result.pagination,
      });
  };
}