import { z } from "zod";

export const auditActions = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "LOGIN",
  "LOGOUT",
  "PAYMENT_UPDATE",
  "STOCK_UPDATE",
] as const;

export const adminAuditParamsSchema =
  z.object({
    auditId: z
      .string()
      .regex(
        /^[a-f\d]{24}$/i,
        "ID de auditoria inválido.",
      ),
  });

export const listAdminAuditQuerySchema =
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

    action: z
      .enum(auditActions)
      .optional(),

    entity: z
      .string()
      .trim()
      .max(100)
      .optional(),

    userPublicId: z
      .string()
      .trim()
      .optional(),

    startDate: z.coerce
      .date()
      .optional(),

    endDate: z.coerce
      .date()
      .optional(),

    sortOrder: z
      .enum([
        "asc",
        "desc",
      ])
      .default("desc"),
  })
  .refine(
    (query) =>
      !query.startDate ||
      !query.endDate ||
      query.startDate <=
        query.endDate,
    {
      path: ["startDate"],

      message:
        "A data inicial não pode ser posterior à data final.",
    },
  );

export type AdminAuditParams =
  z.infer<
    typeof adminAuditParamsSchema
  >;

export type ListAdminAuditQuery =
  z.infer<
    typeof listAdminAuditQuerySchema
  >;