import { z } from "zod";

const optionalTextSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .nullable();

export const createAddressSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(2, "Informe o nome do destinatário.")
    .max(120),

  phone: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido.")
    .max(20)
    .optional()
    .nullable(),

  zipCode: z
    .string()
    .trim()
    .min(8, "Informe um CEP válido.")
    .max(9),

  street: z
    .string()
    .trim()
    .min(2, "Informe a rua.")
    .max(160),

  number: z
    .string()
    .trim()
    .min(1, "Informe o número.")
    .max(30),

  complement: optionalTextSchema,

  neighborhood: z
    .string()
    .trim()
    .min(2, "Informe o bairro.")
    .max(120),

  city: z
    .string()
    .trim()
    .min(2, "Informe a cidade.")
    .max(120),

  state: z
    .string()
    .trim()
    .length(2, "Informe a UF com dois caracteres.")
    .transform((value) => value.toUpperCase()),

  country: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .default("Brasil"),

  label: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable(),

  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema =
  createAddressSchema.partial();

export const addressParamsSchema = z.object({
  addressId: z
    .string()
    .trim()
    .min(1, "Informe o endereço."),
});

export type CreateAddressInput = z.infer<
  typeof createAddressSchema
>;

export type UpdateAddressInput = z.infer<
  typeof updateAddressSchema
>;

export type AddressParams = z.infer<
  typeof addressParamsSchema
>;