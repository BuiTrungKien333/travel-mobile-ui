import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập email.")
  .email("Email chưa đúng định dạng.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ và tên."),
  email: emailSchema,
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
