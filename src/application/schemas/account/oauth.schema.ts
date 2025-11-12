import { z } from "zod";
import {
  emailSchema,
  oauthProviderSchema,
  toDate,
  uuidSchema,
} from "../helper.schema";

/**
 * Schema for OAuth account creation
 * @author Jean Carlos Reyes
 * @version 1.0.0
 * @description This schema defines the structure and validation rules for creating a new OAuth account in the system.
 */
export const createOAuthSchema = z.object({
  userId: uuidSchema,
  provider: oauthProviderSchema,
  providerAccountId: z
    .string()
    .min(1, "Provider Account ID is required")
    .max(255)
    .trim(),
  providerEmail: emailSchema.nullish().optional(),
  accessToken: z.string().min(1, "Access Token is required").max(2000).trim(),
  refreshToken: z.string().min(1).max(2000).trim().nullish().optional(),
  expiresAt: toDate.nullish().optional(),
});

export const upsertOAuthWithUserSchema = z.object({
  provider: oauthProviderSchema,
  providerAccountId: z.string().min(1).max(255).trim(),
  // Datos del perfil
  email: emailSchema,
  name: z.string().trim().min(1).max(255).optional(),
  emailVerified: z.boolean().optional(),

  // Tokens
  accessToken: z.string().min(1).max(2000).trim(),
  refreshToken: z.string().min(1).max(2000).trim().nullish().optional(),
  expiresAt: toDate.nullish().optional(),
});

/**
 * Infer types from schemas
 * @author Jean Carlos Reyes
 * @version 1.0.0
 * @description This section infers TypeScript types from the defined Zod schemas for type safety and consistency.
 */
export type CreateOAuthInput = z.infer<typeof createOAuthSchema>;

export type UpsertOAuthWithUserInput = z.infer<
  typeof upsertOAuthWithUserSchema
>;

export const updateOAuthSchema = z.object({
  accessToken: z.string().min(1).max(2000).trim().optional(),
  refreshToken: z.string().min(1).max(2000).trim().nullish().optional(),
  expiresAt: toDate.nullish().optional(),
});

export type UpdateOAuthInput = z.infer<typeof updateOAuthSchema>;
