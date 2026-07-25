import { z } from "zod";

export const productImageProductParamsSchema = z.object({
  productId: z
    .string({
      error: "O ID do produto é obrigatório.",
    })
    .trim()
    .min(1, "O ID do produto é obrigatório."),
});

export type ProductImageProductParams = z.infer<
  typeof productImageProductParamsSchema
>;

export const productImageParamsSchema = z.object({
  id: z
    .string({
      error: "O ID da imagem é obrigatório.",
    })
    .trim()
    .min(1, "O ID da imagem é obrigatório."),
});

export type ProductImageParams = z.infer<
  typeof productImageParamsSchema
>;

export const createProductImageSchema = z.object({
  url: z
    .string({
      error: "A URL da imagem é obrigatória.",
    })
    .trim()
    .url("Informe uma URL válida."),

  cloudinaryPublicId: z
    .string()
    .trim()
    .max(255, "O Cloudinary Public ID deve ter no máximo 255 caracteres.")
    .optional(),

  altText: z
    .string()
    .trim()
    .max(255, "O texto alternativo deve ter no máximo 255 caracteres.")
    .optional(),

  position: z
    .number({
      error: "A posição deve ser um número.",
    })
    .int("A posição deve ser um número inteiro.")
    .min(0, "A posição não pode ser negativa.")
    .default(0),

  isPrimary: z
    .boolean()
    .default(false),
});

export type CreateProductImageBody = z.infer<
  typeof createProductImageSchema
>;

export const updateProductImageSchema =
  createProductImageSchema.partial();

export type UpdateProductImageBody = z.infer<
  typeof updateProductImageSchema
>;

export const updatePrimaryProductImageSchema = z.object({
  isPrimary: z.boolean({
    error: "O status da imagem principal é obrigatório.",
  }),
});

export type UpdatePrimaryProductImageBody = z.infer<
  typeof updatePrimaryProductImageSchema
>;