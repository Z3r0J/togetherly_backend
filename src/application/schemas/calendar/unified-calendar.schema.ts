import { z } from "zod";

/**
 * Schema for listing unified calendar (personal + circle events)
 */
export const listUnifiedCalendarSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  filter: z
    .enum(["all", "personal", "going", "maybe", "not-going"])
    .optional()
    .default("all"),
});

export type ListUnifiedCalendarQuery = z.infer<
  typeof listUnifiedCalendarSchema
>;
