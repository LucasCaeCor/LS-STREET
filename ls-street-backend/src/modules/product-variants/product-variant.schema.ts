import { z } from "zod";

export const productVariantParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "O ID da variante é obrigatório."),
});

export const productVariantProductParamsSchema = z.object({
  productId: z
    .string()
    .trim()
    .min(1, "O ID do produto é obrigatório."),
});

export const createProductVariantSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(2, "O SKU deve ter pelo menos 2 caracteres.")
      .max(100, "O SKU deve ter no máximo 100 caracteres."),

    color: z
      .string()
      .trim()
      .max(80, "A cor deve ter no máximo 80 caracteres.")
      .optional(),

    size: z
      .string()
      .trim()
      .max(30, "O tamanho deve ter no máximo 30 caracteres.")
      .optional(),

    priceInCents: z
      .number()
      .int("O preço deve ser um número inteiro em centavos.")
      .min(0, "O preço não pode ser negativo."),

    compareAtPriceInCents: z
      .number()
      .int("O preço comparativo deve ser inteiro.")
      .min(0, "O preço comparativo não pode ser negativo.")
      .nullable()
      .optional(),

    costInCents: z
      .number()
      .int("O custo deve ser inteiro.")
      .min(0, "O custo não pode ser negativo.")
      .nullable()
      .optional(),

    stock: z
      .number()
      .int("O estoque deve ser inteiro.")
      .min(0, "O estoque não pode ser negativo.")
      .default(0)
      .optional(),

    reservedStock: z
      .number()
      .int("O estoque reservado deve ser inteiro.")
      .min(0, "O estoque reservado não pode ser negativo.")
      .default(0)
      .optional(),

    lowStockThreshold: z
      .number()
      .int("O limite de estoque baixo deve ser inteiro.")
      .min(0, "O limite de estoque baixo não pode ser negativo.")
      .default(5)
      .optional(),

    barcode: z
      .string()
      .trim()
      .max(100, "O código de barras deve ter no máximo 100 caracteres.")
      .nullable()
      .optional(),

    weightInGrams: z
      .number()
      .int("O peso deve ser inteiro.")
      .min(0, "O peso não pode ser negativo.")
      .nullable()
      .optional(),

    height: z
      .number()
      .min(0, "A altura não pode ser negativa.")
      .nullable()
      .optional(),

    width: z
      .number()
      .min(0, "A largura não pode ser negativa.")
      .nullable()
      .optional(),

    length: z
      .number()
      .min(0, "O comprimento não pode ser negativo.")
      .nullable()
      .optional(),

    isActive: z.boolean().default(true).optional(),
  })
  .refine(
    (data) =>
      data.compareAtPriceInCents === undefined ||
      data.compareAtPriceInCents === null ||
      data.compareAtPriceInCents >= data.priceInCents,
    {
      message:
        "O preço comparativo não pode ser menor que o preço atual.",
      path: ["compareAtPriceInCents"],
    },
  )
  .refine(
    (data) =>
      (data.reservedStock ?? 0) <= (data.stock ?? 0),
    {
      message:
        "O estoque reservado não pode ser maior que o estoque total.",
      path: ["reservedStock"],
    },
  );

export const updateProductVariantSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(2, "O SKU deve ter pelo menos 2 caracteres.")
      .max(100, "O SKU deve ter no máximo 100 caracteres.")
      .optional(),

    color: z
      .string()
      .trim()
      .max(80, "A cor deve ter no máximo 80 caracteres.")
      .nullable()
      .optional(),

    size: z
      .string()
      .trim()
      .max(30, "O tamanho deve ter no máximo 30 caracteres.")
      .nullable()
      .optional(),

    priceInCents: z
      .number()
      .int("O preço deve ser inteiro.")
      .min(0, "O preço não pode ser negativo.")
      .optional(),

    compareAtPriceInCents: z
      .number()
      .int("O preço comparativo deve ser inteiro.")
      .min(0, "O preço comparativo não pode ser negativo.")
      .nullable()
      .optional(),

    costInCents: z
      .number()
      .int("O custo deve ser inteiro.")
      .min(0, "O custo não pode ser negativo.")
      .nullable()
      .optional(),

    lowStockThreshold: z
      .number()
      .int("O limite de estoque baixo deve ser inteiro.")
      .min(0, "O limite de estoque baixo não pode ser negativo.")
      .optional(),

    barcode: z
      .string()
      .trim()
      .max(100, "O código de barras deve ter no máximo 100 caracteres.")
      .nullable()
      .optional(),

    weightInGrams: z
      .number()
      .int("O peso deve ser inteiro.")
      .min(0, "O peso não pode ser negativo.")
      .nullable()
      .optional(),

    height: z
      .number()
      .min(0, "A altura não pode ser negativa.")
      .nullable()
      .optional(),

    width: z
      .number()
      .min(0, "A largura não pode ser negativa.")
      .nullable()
      .optional(),

    length: z
      .number()
      .min(0, "O comprimento não pode ser negativo.")
      .nullable()
      .optional(),

    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe pelo menos um campo para atualizar.",
  })
  .refine(
    (data) =>
      data.priceInCents === undefined ||
      data.compareAtPriceInCents === undefined ||
      data.compareAtPriceInCents === null ||
      data.compareAtPriceInCents >= data.priceInCents,
    {
      message:
        "O preço comparativo não pode ser menor que o preço atual.",
      path: ["compareAtPriceInCents"],
    },
  );

export const updateProductVariantStatusSchema = z.object({
  isActive: z.boolean({
    error: "O campo isActive é obrigatório.",
  }),
});

export const listProductVariantsQuerySchema = z.object({
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

  isActive: z
    .union([
      z.boolean(),
      z.enum(["true", "false"]).transform(
        (value) => value === "true",
      ),
    ])
    .optional(),

  lowStock: z
    .union([
      z.boolean(),
      z.enum(["true", "false"]).transform(
        (value) => value === "true",
      ),
    ])
    .optional(),

  sortBy: z
    .enum([
      "sku",
      "priceInCents",
      "stock",
      "createdAt",
      "updatedAt",
    ])
    .default("createdAt"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

export type ProductVariantParams = z.infer<
  typeof productVariantParamsSchema
>;

export type ProductVariantProductParams = z.infer<
  typeof productVariantProductParamsSchema
>;

export type CreateProductVariantBody = z.infer<
  typeof createProductVariantSchema
>;

export type UpdateProductVariantBody = z.infer<
  typeof updateProductVariantSchema
>;

export type UpdateProductVariantStatusBody = z.infer<
  typeof updateProductVariantStatusSchema
>;

export type ListProductVariantsQuery = z.infer<
  typeof listProductVariantsQuerySchema
>;