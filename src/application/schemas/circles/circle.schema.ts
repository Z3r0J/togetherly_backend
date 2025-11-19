import { z } from "zod";

/**
 * Schema for creating a circle
 */
export const createCircleSchema = z.object({
  name: z.string().min(1, "Circle name is required").max(255, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  privacy: z.enum(["public", "invite-only"]).default("invite-only"),
});

/**
 * Schema for updating a circle
 */
export const updateCircleSchema = z.object({
  name: z
    .string()
    .min(1, "Circle name is required")
    .max(255, "Name too long")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  privacy: z.enum(["public", "invite-only"]).optional(),
});

/**
 * Schema for adding a member to a circle
 */
export const addCircleMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["member", "admin"]).default("member"),
});

/**
 * Schema for updating a member's role
 */
export const updateCircleMemberRoleSchema = z.object({
  role: z.enum(["member", "admin"]),
});

export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type UpdateCircleInput = z.infer<typeof updateCircleSchema>;
export type AddCircleMemberInput = z.infer<typeof addCircleMemberSchema>;
export type UpdateCircleMemberRoleInput = z.infer<
  typeof updateCircleMemberRoleSchema
>;
