import { z } from "zod";

export const orderNumberParamsSchema = z.object({
  number: z.coerce
    .number()
    .int()
    .positive("O número do pedido deve ser positivo."),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(50)
    .default(10),
});

export type OrderNumberParams = z.infer<
  typeof orderNumberParamsSchema
>;

export type ListOrdersQuery = z.infer<
  typeof listOrdersQuerySchema
>;