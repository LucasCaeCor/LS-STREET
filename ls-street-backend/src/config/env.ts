import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().default(3333),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(7),

  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),

  COOKIE_DOMAIN: z.string().optional(),

  API_URL: z
    .string()
    .url()
    .default("http://localhost:3333"),

  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME é obrigatório."),

  CLOUDINARY_API_KEY: z
    .string()
    .min(1, "CLOUDINARY_API_KEY é obrigatório."),

  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET é obrigatório."),

  LOG_LEVEL: z
    .enum([
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent",
    ])
    .default("info"),

  SWAGGER_ENABLED: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Variáveis de ambiente inválidas:",
    parsedEnv.error.flatten().fieldErrors,
  );

  throw new Error("Invalid environment variables.");
}

export const env = parsedEnv.data;