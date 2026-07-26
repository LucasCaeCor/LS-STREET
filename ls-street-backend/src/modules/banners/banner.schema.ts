import { z } from "zod";

const bannerPositionSchema = z.enum([
  "HOME_HERO",
  "HOME_MIDDLE",
  "CATEGORY",
  "PROMOTION",
]);

export const bannerParamsSchema =
  z.object({
    bannerId: z
      .string()
      .regex(
        /^[a-f\d]{24}$/i,
        "ID do banner inválido.",
      ),
  });

export const createBannerSchema =
  z
    .object({
      title: z
        .string()
        .trim()
        .min(2)
        .max(150),

      subtitle: z
        .string()
        .trim()
        .max(300)
        .optional(),

      imageUrl: z
        .string()
        .trim()
        .url(),

      mobileImageUrl: z
        .string()
        .trim()
        .url()
        .optional(),

      publicId: z
        .string()
        .trim()
        .max(300)
        .optional(),

      link: z
        .string()
        .trim()
        .max(500)
        .optional(),

      buttonText: z
        .string()
        .trim()
        .max(60)
        .optional(),

      position:
        bannerPositionSchema.default(
          "HOME_HERO",
        ),

      sortOrder: z.coerce
        .number()
        .int()
        .min(0)
        .default(0),

      active:
        z.boolean().default(true),

      startsAt: z.coerce
        .date()
        .optional(),

      endsAt: z.coerce
        .date()
        .optional(),
    })
    .refine(
      (data) =>
        !data.startsAt ||
        !data.endsAt ||
        data.startsAt < data.endsAt,
      {
        path: ["endsAt"],
        message:
          "O encerramento deve ser posterior ao início.",
      },
    );

export const updateBannerSchema =
  z
    .object({
      title: z
        .string()
        .trim()
        .min(2)
        .max(150)
        .optional(),

      subtitle: z
        .string()
        .trim()
        .max(300)
        .nullable()
        .optional(),

      imageUrl: z
        .string()
        .trim()
        .url()
        .optional(),

      mobileImageUrl: z
        .string()
        .trim()
        .url()
        .nullable()
        .optional(),

      publicId: z
        .string()
        .trim()
        .max(300)
        .nullable()
        .optional(),

      link: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),

      buttonText: z
        .string()
        .trim()
        .max(60)
        .nullable()
        .optional(),

      position:
        bannerPositionSchema.optional(),

      sortOrder: z.coerce
        .number()
        .int()
        .min(0)
        .optional(),

      active:
        z.boolean().optional(),

      startsAt: z
        .union([
          z.coerce.date(),
          z.null(),
        ])
        .optional(),

      endsAt: z
        .union([
          z.coerce.date(),
          z.null(),
        ])
        .optional(),
    })
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "Informe pelo menos um campo para atualizar.",
      },
    );

export const listAdminBannersQuerySchema =
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

    position:
      bannerPositionSchema.optional(),

    active: z
      .enum(["true", "false"])
      .transform(
        (value) =>
          value === "true",
      )
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("asc"),
  });

export const listPublicBannersQuerySchema =
  z.object({
    position:
      bannerPositionSchema.optional(),
  });

export type BannerParams =
  z.infer<
    typeof bannerParamsSchema
  >;

export type CreateBannerBody =
  z.infer<
    typeof createBannerSchema
  >;

export type UpdateBannerBody =
  z.infer<
    typeof updateBannerSchema
  >;

export type ListAdminBannersQuery =
  z.infer<
    typeof listAdminBannersQuerySchema
  >;

export type ListPublicBannersQuery =
  z.infer<
    typeof listPublicBannersQuerySchema
  >;