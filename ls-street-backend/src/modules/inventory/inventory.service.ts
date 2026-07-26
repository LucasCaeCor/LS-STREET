import type {
  InventoryMovementType,
} from "@prisma/client";

import {
  AppError,
} from "../../core/errors/app-error";

import {
  createPaginationMetadata,
} from "../../core/pagination/pagination";

import {
  InventoryRepository,
} from "./inventory.repository";

import type {
  AdjustInventoryBody,
  ListInventoryMovementsQuery,
} from "./inventory.schema";

export class InventoryService {
  constructor(
    private readonly repository:
      InventoryRepository,
  ) {}

  async adjust(
    variantPublicId: string,
    body: AdjustInventoryBody,
  ) {
    const variant =
      await this.repository
        .findVariantByPublicId(
          variantPublicId,
        );

    if (!variant) {
      throw new AppError(
        "Variante não encontrada.",
        404,
        "VARIANT_NOT_FOUND",
      );
    }

    if (
      body.type !==
        "ADJUSTMENT" &&
      body.quantity < 0
    ) {
      throw new AppError(
        "Somente movimentações do tipo ADJUSTMENT podem possuir quantidade negativa.",
        422,
        "INVALID_INVENTORY_QUANTITY",
      );
    }

    const newStock =
      variant.stock +
      body.quantity;

    if (newStock < 0) {
      throw new AppError(
        "O ajuste deixaria o estoque negativo.",
        422,
        "INSUFFICIENT_STOCK",
        {
          currentStock:
            variant.stock,

          requestedQuantity:
            body.quantity,
        },
      );
    }

    if (
      newStock <
      variant.reservedStock
    ) {
      throw new AppError(
        "O estoque não pode ficar menor que a quantidade reservada.",
        422,
        "STOCK_BELOW_RESERVED",
        {
          currentStock:
            variant.stock,

          reservedStock:
            variant.reservedStock,

          requestedStock:
            newStock,
        },
      );
    }

    const result =
      await this.repository
        .adjustStock({
          variantId:
            variant.id,

          type:
            body.type as
              InventoryMovementType,

          quantity:
            body.quantity,

          previousStock:
            variant.stock,

          newStock,

          reason:
            body.reason,

          referenceId:
            body.referenceId,
        });

    return {
      ...result,

      availableStock:
        Math.max(
          0,
          result.variant.stock -
            result.variant
              .reservedStock,
        ),

      lowStock:
        result.variant.stock <=
        result.variant
          .lowStockThreshold,
    };
  }

  async listMovements(
    query:
      ListInventoryMovementsQuery,
  ) {
    const result =
      await this.repository
        .listMovements({
          page: query.page,
          limit: query.limit,

          search:
            query.search,

          variantId:
            query.variantId,

          type:
            query.type,

          sortOrder:
            query.sortOrder,
        });

    return {
      movements:
        result.movements.map(
          (movement) => ({
            ...movement,

            variant: {
              ...movement.variant,

              availableStock:
                Math.max(
                  0,
                  movement.variant
                    .stock -
                    movement.variant
                      .reservedStock,
                ),

              lowStock:
                movement.variant
                  .stock <=
                movement.variant
                  .lowStockThreshold,

              product: {
                ...movement.variant
                  .product,

                imageUrl:
                  movement.variant
                    .product
                    .images[0]
                    ?.url ?? null,
              },
            },
          }),
        ),

      pagination:
        createPaginationMetadata(
          query.page,
          query.limit,
          result.totalItems,
        ),
    };
  }
}