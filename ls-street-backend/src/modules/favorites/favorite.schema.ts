import { z } from "zod";

export const favoriteProductParamsSchema =
  z.object({
    productId: z
      .string()
      .trim()
      .min(
        1,
        "Informe o ID do produto.",
      ),
  });

export const listFavoritesQuerySchema =
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

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  });

export type FavoriteProductParams =
  z.infer<
    typeof favoriteProductParamsSchema
  >;

export type ListFavoritesQuery =
  z.infer<
    typeof listFavoritesQuerySchema
  >;