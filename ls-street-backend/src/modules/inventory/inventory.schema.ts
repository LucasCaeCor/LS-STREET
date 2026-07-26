import { z } from "zod";

export const inventoryVariantParamsSchema =
  z.object({
    variantId: z
      .string()
      .trim()
      .min(1),
  });

export const adjustInventorySchema =
  z.object({
    type: z.enum([
      "INITIAL",
      "PURCHASE",
      "RETURN",
      "ADJUSTMENT",
      "CANCELLATION",
    ]),

    quantity: z.coerce
      .number()
      .int()
      .refine(
        (value) => value !== 0,
        {
          message:
            "A quantidade não pode ser zero.",
        },
      ),

    reason: z
      .string()
      .trim()
      .min(3)
      .max(300)
      .optional(),

    referenceId: z
      .string()
      .trim()
      .max(100)
      .optional(),
  });

export const listInventoryMovementsQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    variantId: z
      .string()
      .trim()
      .optional(),

    type: z
      .enum([
        "INITIAL",
        "PURCHASE",
        "SALE",
        "RETURN",
        "ADJUSTMENT",
        "CANCELLATION",
      ])
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  });

export type InventoryVariantParams =
  z.infer<
    typeof inventoryVariantParamsSchema
  >;

export type AdjustInventoryBody =
  z.infer<
    typeof adjustInventorySchema
  >;

export type ListInventoryMovementsQuery =
  z.infer<
    typeof listInventoryMovementsQuerySchema
  >;