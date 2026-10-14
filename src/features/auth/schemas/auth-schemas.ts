import { z } from "zod";
import { utf8ByteLength } from "../utils/utf8-byte-length.ts";

const emailSchema = z
  .string()
  .trim()
  .min(1, "validation.emailRequired")
  .email("validation.emailInvalid");
const boundedEmailSchema = emailSchema.max(255, "validation.emailMax");
const boundedPasswordSchema = z
  .string()
  .max(50, "validation.passwordMax")
  .refine(
    (password) => utf8ByteLength(password) <= 72,
    "validation.passwordBytes",
  );

export const loginSchema = z.object({
  email: boundedEmailSchema,
  password: boundedPasswordSchema.refine(
    (password) => password.length > 0,
    "validation.passwordRequired",
  ),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "validation.fullNameRequired")
    .max(100, "validation.fullNameMax"),
  email: boundedEmailSchema,
  password: boundedPasswordSchema.refine(
    (password) => password.length >= 8,
    "validation.passwordMin",
  ),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const emailRequestSchema = z.object({ email: boundedEmailSchema });
export type EmailRequestFormValues = z.infer<typeof emailRequestSchema>;
export const resetPasswordSchema = z
  .object({
    password: registerSchema.shape.password,
    confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "validation.passwordMismatch",
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
