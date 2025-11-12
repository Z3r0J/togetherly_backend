import z from "zod";
import { emailSchema, toDate, uuidSchema } from "../helper.schema";

// Usuario solicita un magic link por email
export const requestMagicLinkSchema = z.object({
  email: emailSchema,
});

export type RequestMagicLinkInput = z.infer<typeof requestMagicLinkSchema>;

// Backend emite token (para persistir)
export const issueMagicLinkSchema = z.object({
  userId: uuidSchema,
  // token puede ser raw (si lo vas a hashear antes de guardar) o ya hashed:
  token: z
    .string()
    .min(16, "Token too short")
    .max(512, "Token too long")
    .trim(),
  expiresAt: toDate.refine((d) => d.getTime() > Date.now(), {
    message: "expiresAt must be in the future",
  }),
});

export type IssueMagicLinkInput = z.infer<typeof issueMagicLinkSchema>;

// Verificación (desde query ?token=)
export const verifyMagicLinkSchema = z.object({
  token: z.string().min(16).max(512).trim(),
});

export type VerifyMagicLinkInput = z.infer<typeof verifyMagicLinkSchema>;
