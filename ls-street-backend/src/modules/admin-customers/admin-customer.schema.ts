import {
  UserStatus,
} from "@prisma/client";

import {
  z,
} from "zod";

export const listAdminCustomersQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),

    search: z
      .string()
      .trim()
      .min(1)
      .max(150)
      .optional(),

    status: z
      .nativeEnum(
        UserStatus,
      )
      .optional(),

    emailVerified: z
      .enum([
        "true",
        "false",
      ])
      .transform(
        (value) =>
          value === "true",
      )
      .optional(),

    sortBy: z
      .enum([
        "name",
        "createdAt",
        "lastLoginAt",
      ])
      .default(
        "createdAt",
      ),

    sortOrder: z
      .enum([
        "asc",
        "desc",
      ])
      .default("desc"),
  });

export const customerPublicIdParamsSchema =
  z.object({
    publicId: z
      .string()
      .trim()
      .min(10)
      .max(50),
  });

export const updateCustomerStatusSchema =
  z.object({
    status: z.nativeEnum(
      UserStatus,
    ),
  });

export type ListAdminCustomersQuery =
  z.infer<
    typeof listAdminCustomersQuerySchema
  >;

export type CustomerPublicIdParams =
  z.infer<
    typeof customerPublicIdParamsSchema
  >;

export type UpdateCustomerStatusBody =
  z.infer<
    typeof updateCustomerStatusSchema
  >;