import { z } from "zod";

// Schema for sending invitations
export const sendInvitationSchema = z.object({
  circleId: z.string().uuid("Circle ID must be a valid UUID"),
  emails: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one email is required")
    .max(10, "Maximum 10 emails allowed per request"),
  type: z.enum(["email", "link"]).default("email"),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>;

// Schema for accepting invitations
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

// Schema for getting invitation details (token from URL params)
export const getInvitationDetailsSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type GetInvitationDetailsInput = z.infer<
  typeof getInvitationDetailsSchema
>;
