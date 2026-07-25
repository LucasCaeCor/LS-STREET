import { z } from "zod";

export const productStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
]);

export const productSortBySchema = z.enum([
  "name",
  "createdAt",
  "updatedAt",
  
]);

export const sortOrderSchema = z.enum(["asc", "desc"]);

export const productParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "O ID do produto é obrigatório."),
});

export const productSlugParamsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "O slug do produto é obrigatório."),
});

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),

  slug: z
    .string()
    .trim()
    .min(2, "O slug deve ter pelo menos 2 caracteres.")
    .max(180, "O slug deve ter no máximo 180 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "O slug deve conter apenas letras minúsculas, números e hífens.",
    )
    .optional(),

  description: z
    .string()
    .trim()
    .max(5000, "A descrição deve ter no máximo 5000 caracteres.")
    .optional(),

  shortDescription: z
    .string()
    .trim()
    .max(500, "A descrição curta deve ter no máximo 500 caracteres.")
    .optional(),

  brand: z
    .string()
    .trim()
    .max(100, "A marca deve ter no máximo 100 caracteres.")
    .optional(),

  status: productStatusSchema
    .default("DRAFT")
    .optional(),

  isFeatured: z
    .boolean()
    .default(false)
    .optional(),

  seoTitle: z
    .string()
    .trim()
    .max(70, "O título SEO deve ter no máximo 70 caracteres.")
    .optional(),

  seoDescription: z
    .string()
    .trim()
    .max(160, "A descrição SEO deve ter no máximo 160 caracteres.")
    .optional(),

  categoryId: z
    .string()
    .trim()
    .min(1, "A categoria é obrigatória."),
});

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome deve ter pelo menos 2 caracteres.")
      .max(150, "O nome deve ter no máximo 150 caracteres.")
      .optional(),

    slug: z
      .string()
      .trim()
      .min(2, "O slug deve ter pelo menos 2 caracteres.")
      .max(180, "O slug deve ter no máximo 180 caracteres.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "O slug deve conter apenas letras minúsculas, números e hífens.",
      )
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, "A descrição deve ter no máximo 5000 caracteres.")
      .nullable()
      .optional(),

    shortDescription: z
      .string()
      .trim()
      .max(500, "A descrição curta deve ter no máximo 500 caracteres.")
      .nullable()
      .optional(),

    brand: z
      .string()
      .trim()
      .max(100, "A marca deve ter no máximo 100 caracteres.")
      .nullable()
      .optional(),

    seoTitle: z
      .string()
      .trim()
      .max(70, "O título SEO deve ter no máximo 70 caracteres.")
      .nullable()
      .optional(),

    seoDescription: z
      .string()
      .trim()
      .max(160, "A descrição SEO deve ter no máximo 160 caracteres.")
      .nullable()
      .optional(),

    categoryId: z
      .string()
      .trim()
      .min(1, "A categoria é obrigatória.")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Informe pelo menos um campo para atualizar.",
    },
  );

export const updateProductStatusSchema = z.object({
  status: productStatusSchema,
});

export const updateProductFeaturedSchema = z.object({
  isFeatured: z.boolean({
    error: "O campo isFeatured é obrigatório.",
  }),
});

export const listProductsQuerySchema = z.object({
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
    .optional(),

  categoryId: z
    .string()
    .trim()
    .optional(),

  categorySlug: z
    .string()
    .trim()
    .optional(),

  brand: z
    .string()
    .trim()
    .optional(),

  status: productStatusSchema.optional(),

  isFeatured: z
    .union([
      z.boolean(),
      z.enum(["true", "false"]).transform((value) => value === "true"),
    ])
    .optional(),

  minPriceInCents: z.coerce
    .number()
    .int()
    .min(0)
    .optional(),

  maxPriceInCents: z.coerce
    .number()
    .int()
    .min(0)
    .optional(),

  sortBy: productSortBySchema
    .default("createdAt"),

  sortOrder: sortOrderSchema
    .default("desc"),
}).refine(
  (data) => {
    if (
      data.minPriceInCents !== undefined &&
      data.maxPriceInCents !== undefined
    ) {
      return data.minPriceInCents <= data.maxPriceInCents;
    }

    return true;
  },
  {
    message:
      "O preço mínimo não pode ser maior que o preço máximo.",
    path: ["minPriceInCents"],
  },
);

export type ProductParams = z.infer<
  typeof productParamsSchema
>;

export type ProductSlugParams = z.infer<
  typeof productSlugParamsSchema
>;

export type CreateProductBody = z.infer<
  typeof createProductSchema
>;

export type UpdateProductBody = z.infer<
  typeof updateProductSchema
>;

export type UpdateProductStatusBody = z.infer<
  typeof updateProductStatusSchema
>;

export type UpdateProductFeaturedBody = z.infer<
  typeof updateProductFeaturedSchema
>;

export type ListProductsQuery = z.infer<
  typeof listProductsQuerySchema
>;