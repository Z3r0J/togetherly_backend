import { z } from "zod";
import { emailSchema, toDate } from "../helper.schema";

/**
 * Schema for login an user using email and password
 * @author Jean Carlos Reyes
 * @version 1.0.0
 * @description This schema defines the structure and validation rules for logging in a user using email and password.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long"),
});

/**
 * Schema for creating a new user
 * @author Jean Carlos Reyes
 * @version 1.0.0
 *
 * @description This schema defines the structure and validation rules for creating a new user in the system.
 */
export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long"),
  isEmailVerified: z.boolean().optional(),
  emailVerifiedAt: toDate.nullish(), // allow undefined or null
});

/**
 * Schema for updating an existing user
 * @author Jean Carlos Reyes
 * @version 1.0.0
 * @description This schema defines the structure and validation rules for updating an existing user in the system.
 */

export const updateUserSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  name: z.string().trim().min(1).max(255).optional(),
  email: emailSchema.optional(),
  isEmailVerified: z.boolean().optional(),
  emailVerifiedAt: toDate.nullish().optional(),
  isDeleted: z.boolean().optional(),
  deletedAt: toDate.nullish().optional(),
});

/**
 * Schema for user ID parameter
 * @author Jean Carlos Reyes
 * @version 1.0.0
 * @description This schema defines the structure and validation rules for user ID parameters.
 */

export const userIdSchema = z.object({
  id: z.string().uuid("ID must be a valid UUID"),
});

/**
 * Infer types from schemas
 * @author Jean Carlos Reyes
 * @version 1.0.0
 * @description This section infers TypeScript types from the defined Zod schemas for type safety and consistency.
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
