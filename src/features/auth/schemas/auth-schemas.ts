import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "validation.emailRequired")
  .email("validation.emailInvalid");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "validation.passwordRequired"),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "validation.fullNameRequired"),
  email: emailSchema,
  password: z.string().min(8, "validation.passwordMin"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
