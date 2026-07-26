import { z } from "zod";

const couponCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "O código pode conter apenas letras, números, hífen e underline.",
  )
  .transform((code) =>
    code.toUpperCase(),
  );

export const couponParamsSchema =
  z.object({
    couponId: z
      .string()
      .regex(
        /^[a-f\d]{24}$/i,
        "ID do cupom inválido.",
      ),
  });

export const createCouponSchema =
  z
    .object({
      code: couponCodeSchema,

      description: z
        .string()
        .trim()
        .min(3)
        .max(300)
        .optional(),

      type: z.enum([
        "PERCENTAGE",
        "FIXED",
        "FREE_SHIPPING",
      ]),

      value: z.coerce
        .number()
        .int()
        .min(0),

      minimumOrderInCents:
        z.coerce
          .number()
          .int()
          .min(0)
          .default(0),

      maximumDiscountInCents:
        z.coerce
          .number()
          .int()
          .min(1)
          .optional(),

      usageLimit: z.coerce
        .number()
        .int()
        .min(1)
        .optional(),

      usageLimitPerUser:
        z.coerce
          .number()
          .int()
          .min(1)
          .optional(),

      startsAt: z.coerce
        .date()
        .optional(),

      expiresAt: z.coerce
        .date()
        .optional(),

      active: z.boolean()
        .default(true),
    })
    .superRefine(
      (data, context) => {
        if (
          data.type ===
            "PERCENTAGE" &&
          (
            data.value < 1 ||
            data.value > 100
          )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["value"],

            message:
              "O desconto percentual deve estar entre 1 e 100.",
          });
        }

        if (
          data.type === "FIXED" &&
          data.value < 1
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["value"],

            message:
              "O desconto fixo deve ser maior que zero.",
          });
        }

        if (
          data.type ===
            "FREE_SHIPPING" &&
          data.value !== 0
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["value"],

            message:
              "Cupons de frete grátis devem possuir valor zero.",
          });
        }

        if (
          data.startsAt &&
          data.expiresAt &&
          data.startsAt >=
            data.expiresAt
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: ["expiresAt"],

            message:
              "A expiração deve ser posterior ao início.",
          });
        }
      },
    );

export const updateCouponSchema =
  z.object({
    code:
      couponCodeSchema.optional(),

    description: z
      .string()
      .trim()
      .min(3)
      .max(300)
      .nullable()
      .optional(),

    type: z
      .enum([
        "PERCENTAGE",
        "FIXED",
        "FREE_SHIPPING",
      ])
      .optional(),

    value: z.coerce
      .number()
      .int()
      .min(0)
      .optional(),

    minimumOrderInCents:
      z.coerce
        .number()
        .int()
        .min(0)
        .optional(),

    maximumDiscountInCents:
      z.union([
        z.coerce
          .number()
          .int()
          .min(1),

        z.null(),
      ])
        .optional(),

    usageLimit:
      z.union([
        z.coerce
          .number()
          .int()
          .min(1),

        z.null(),
      ])
        .optional(),

    usageLimitPerUser:
      z.union([
        z.coerce
          .number()
          .int()
          .min(1),

        z.null(),
      ])
        .optional(),

    startsAt:
      z.union([
        z.coerce.date(),
        z.null(),
      ])
        .optional(),

    expiresAt:
      z.union([
        z.coerce.date(),
        z.null(),
      ])
        .optional(),

    active:
      z.boolean().optional(),
  });

export const listCouponsQuerySchema =
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

    type: z
      .enum([
        "PERCENTAGE",
        "FIXED",
        "FREE_SHIPPING",
      ])
      .optional(),

    active: z
      .enum(["true", "false"])
      .transform(
        (value) =>
          value === "true",
      )
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  });

export const validateCouponSchema =
  z.object({
    code: couponCodeSchema,

    subtotalInCents:
      z.coerce
        .number()
        .int()
        .min(1),
  });

export type CouponParams =
  z.infer<
    typeof couponParamsSchema
  >;

export type CreateCouponBody =
  z.infer<
    typeof createCouponSchema
  >;

export type UpdateCouponBody =
  z.infer<
    typeof updateCouponSchema
  >;

export type ListCouponsQuery =
  z.infer<
    typeof listCouponsQuerySchema
  >;

export type ValidateCouponBody =
  z.infer<
    typeof validateCouponSchema
  >;