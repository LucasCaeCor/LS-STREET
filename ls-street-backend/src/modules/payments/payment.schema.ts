import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const paymentOrderNumberParamsSchema = z.object({
  number: z.coerce
    .number()
    .int()
    .positive("O número do pedido deve ser positivo."),
});

export const createPaymentSchema = z.object({
  method: z.nativeEnum(PaymentMethod),

  installments: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .optional(),
}).superRefine((data, context) => {
  if (
    data.method !== "CREDIT_CARD" &&
    data.installments !== undefined
  ) {
    context.addIssue({
      code: "custom",
      path: ["installments"],
      message:
        "Parcelas só podem ser informadas para cartão de crédito.",
    });
  }

  if (
    data.method === "CREDIT_CARD" &&
    data.installments === undefined
  ) {
    context.addIssue({
      code: "custom",
      path: ["installments"],
      message:
        "Informe a quantidade de parcelas.",
    });
  }
});

export type PaymentOrderNumberParams = z.infer<
  typeof paymentOrderNumberParamsSchema
>;

export type CreatePaymentBody = z.infer<
  typeof createPaymentSchema
>;