import z from "zod";
import { uuidSchema } from "../helper.schema";

export const setCredentialSchema = z.object({
  userId: uuidSchema,
  passwordHash: z.string().min(10, "Hash looks too short").max(255),
});

export type SetCredentialInput = z.infer<typeof setCredentialSchema>;

// Para borrar credencial (passwordless)
export const clearCredentialSchema = z.object({
  userId: uuidSchema,
});

export type ClearCredentialInput = z.infer<typeof clearCredentialSchema>;
