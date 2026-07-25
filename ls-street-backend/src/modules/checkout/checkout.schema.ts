import { z } from "zod";

export const createCheckoutSchema = z.object({
  addressId: z
    .string()
    .trim()
    .min(1, "Informe o endereço de entrega."),
});

export type CreateCheckoutInput = z.infer<
  typeof createCheckoutSchema
>;