import { z } from "zod";

export const createCheckoutSchema = z.object({
  addressId: z
    .string()
    .trim()
    .min(1, "Informe o endereço de entrega."),

  couponCode: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((code) =>
      code.toUpperCase(),
    )
    .optional(),
});

export type CreateCheckoutInput = z.infer<
  typeof createCheckoutSchema
>;