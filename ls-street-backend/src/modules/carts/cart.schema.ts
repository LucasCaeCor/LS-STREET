import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z
    .string()
    .trim()
    .min(1, "O identificador da variante é obrigatório."),

  quantity: z
    .number()
    .int("A quantidade deve ser um número inteiro.")
    .min(1, "A quantidade mínima é 1.")
    .max(100, "A quantidade máxima permitida é 100."),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("A quantidade deve ser um número inteiro.")
    .min(1, "A quantidade mínima é 1.")
    .max(100, "A quantidade máxima permitida é 100."),
});

export const cartItemParamsSchema = z.object({
  itemId: z.string().trim().min(1, "O identificador do item é obrigatório."),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemParams = z.infer<typeof cartItemParamsSchema>;