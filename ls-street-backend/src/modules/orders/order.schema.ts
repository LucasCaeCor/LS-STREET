import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export const orderNumberParamsSchema = z.object({
  number: z.coerce
    .number()
    .int()
    .positive("O número do pedido deve ser positivo."),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(50)
    .default(10),
});

export const listAdminOrdersQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),

    status: z.nativeEnum(OrderStatus).optional(),

    number: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    customer: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .optional(),

    from: z.coerce.date().optional(),

    to: z.coerce.date().optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  })
  .refine(
    ({ from, to }) => {
      if (!from || !to) {
        return true;
      }

      return from <= to;
    },
    {
      message:
        "A data inicial não pode ser posterior à data final.",
      path: ["from"],
    },
  );

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),

  trackingCode: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  trackingUrl: z
    .string()
    .trim()
    .url("A URL de rastreio deve ser válida.")
    .optional(),
});

export type OrderNumberParams = z.infer<
  typeof orderNumberParamsSchema
>;

export type ListOrdersQuery = z.infer<
  typeof listOrdersQuerySchema
>;

export type ListAdminOrdersQuery = z.infer<
  typeof listAdminOrdersQuerySchema
>;

export type UpdateOrderStatusBody = z.infer<
  typeof updateOrderStatusSchema
>;