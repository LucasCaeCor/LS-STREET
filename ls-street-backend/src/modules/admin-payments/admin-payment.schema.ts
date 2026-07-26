import { z } from "zod";

export const adminPaymentParamsSchema =
  z.object({
    paymentId: z
      .string()
      .regex(
        /^[a-f\d]{24}$/i,
        "ID do pagamento inválido.",
      ),
  });

export const listAdminPaymentsQuerySchema =
  z.object({
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
      .max(100)
      .optional(),

    status: z
      .enum([
        "PENDING",
        "IN_PROCESS",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "REFUNDED",
        "CHARGED_BACK",
      ])
      .optional(),

    method: z
      .enum([
        "PIX",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "BOLETO",
        "OTHER",
      ])
      .optional(),

    gateway: z
      .enum([
        "MERCADO_PAGO",
      ])
      .optional(),

    startDate: z.coerce
      .date()
      .optional(),

    endDate: z.coerce
      .date()
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  })
  .refine(
    (query) =>
      !query.startDate ||
      !query.endDate ||
      query.startDate <= query.endDate,
    {
      message:
        "A data inicial não pode ser posterior à data final.",

      path: ["startDate"],
    },
  );

export type AdminPaymentParams =
  z.infer<
    typeof adminPaymentParamsSchema
  >;

export type ListAdminPaymentsQuery =
  z.infer<
    typeof listAdminPaymentsQuerySchema
  >;