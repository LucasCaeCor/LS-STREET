import { z } from "zod";

export const adminDashboardQuerySchema =
  z.object({
    days: z.coerce
      .number()
      .int()
      .min(7)
      .max(90)
      .default(30),
  });

export type AdminDashboardQuery =
  z.infer<
    typeof adminDashboardQuerySchema
  >;