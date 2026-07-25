import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "O nome deve possuir pelo menos 3 caracteres.")
    .max(100, "O nome deve possuir no máximo 100 caracteres."),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "A senha deve possuir pelo menos 8 caracteres.")
    .max(72, "A senha deve possuir no máximo 72 caracteres.")
    .regex(/[a-z]/, "A senha deve conter uma letra minúscula.")
    .regex(/[A-Z]/, "A senha deve conter uma letra maiúscula.")
    .regex(/[0-9]/, "A senha deve conter um número."),

  phone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido.")
    .max(20, "Informe um telefone válido.")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((email) => email.toLowerCase()),

  password: z.string().min(1, "Informe a senha."),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;