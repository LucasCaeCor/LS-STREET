import {
  z,
} from "zod";

const couponCodeSchema = z
  .string()
  .trim()
  .min(
    3,
    "O cupom deve possuir pelo menos 3 caracteres.",
  )
  .max(30)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "O cupom pode conter apenas letras, números, hífen e underline.",
  )
  .transform(
    (value) =>
      value.toUpperCase(),
  );

export const createCheckoutSchema =
  z.object({
    addressId: z
      .string()
      .trim()
      .min(
        1,
        "Informe o endereço de entrega.",
      ),

    couponCode:
      couponCodeSchema.optional(),
  });

export type CreateCheckoutInput =
  z.infer<
    typeof createCheckoutSchema
  >;