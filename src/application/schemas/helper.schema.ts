import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID");

export const toDate = z.preprocess((v) => {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") return new Date(v);
  return v;
}, z.date());

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email must be less than 255 characters")
  .email("Invalid email format")
  .transform((s) => s.toLowerCase());

export const oauthProviderSchema = z
  .enum(["google", "apple", "facebook", "github"])
  .or(z.string().min(1).max(100));

export const idParamSchema = z.object({ id: uuidSchema });
export type IdParam = z.infer<typeof idParamSchema>;

export const emailParamSchema = z.object({ email: emailSchema });
export type EmailParam = z.infer<typeof emailParamSchema>;
