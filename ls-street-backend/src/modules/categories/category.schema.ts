import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve possuir pelo menos 2 caracteres.")
    .max(80, "O nome deve possuir no máximo 80 caracteres."),

  description: z
    .string()
    .trim()
    .max(500, "A descrição deve possuir no máximo 500 caracteres.")
    .optional(),

  imageUrl: z
    .string()
    .url("Informe uma URL de imagem válida.")
    .optional(),

  imagePublicId: z
    .string()
    .trim()
    .max(200)
    .optional(),
});

export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome deve possuir pelo menos 2 caracteres.")
      .max(80, "O nome deve possuir no máximo 80 caracteres.")
      .optional(),

    description: z
      .union([
        z
          .string()
          .trim()
          .max(500, "A descrição deve possuir no máximo 500 caracteres."),
        z.null(),
      ])
      .optional(),

    imageUrl: z
      .union([
        z.string().url("Informe uma URL de imagem válida."),
        z.null(),
      ])
      .optional(),

    imagePublicId: z
      .union([
        z.string().trim().max(200),
        z.null(),
      ])
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos um campo para atualização.",
  );

export const categoryParamsSchema = z.object({
  id: z.string().trim().min(1, "Informe o identificador da categoria."),
});

export const categorySlugParamsSchema = z.object({
  slug: z.string().trim().min(1, "Informe o slug da categoria."),
});

export const updateCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

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

  sortOrder: z
    .enum(["asc", "desc"])
    .default("asc"),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type CreateCategoryBody = z.infer<
  typeof createCategorySchema
>;

export type UpdateCategoryBody = z.infer<
  typeof updateCategorySchema
>;

export type CategoryParams = z.infer<
  typeof categoryParamsSchema
>;

export type CategorySlugParams = z.infer<
  typeof categorySlugParamsSchema
>;

export type UpdateCategoryStatusBody = z.infer<
  typeof updateCategoryStatusSchema
>;

export type ListCategoriesQuery = z.infer<
  typeof listCategoriesQuerySchema
>;