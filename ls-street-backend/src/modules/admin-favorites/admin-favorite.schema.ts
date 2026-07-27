import {
  z,
} from "zod";

export const listAdminFavoritesQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),

    search: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .optional(),

    sortOrder: z
      .enum([
        "asc",
        "desc",
      ])
      .default("desc"),
  });

export type ListAdminFavoritesQuery =
  z.infer<
    typeof listAdminFavoritesQuerySchema
  >;