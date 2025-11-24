import { z } from "zod";

// Schema for creating a personal event
export const createPersonalEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  date: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  allDay: z.boolean().optional().default(false),
  location: z
    .object({
      name: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  color: z.string().max(50).optional(),
  reminderMinutes: z.number().int().min(0).optional(),
});

export type CreatePersonalEventInput = z.infer<
  typeof createPersonalEventSchema
>;

// Schema for updating a personal event
export const updatePersonalEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  date: z.coerce.date().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  location: z
    .object({
      name: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  color: z.string().max(50).optional(),
  reminderMinutes: z.number().int().min(0).optional(),
});

export type UpdatePersonalEventInput = z.infer<
  typeof updatePersonalEventSchema
>;

// Schema for listing personal events with date range
export const listPersonalEventsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ListPersonalEventsQuery = z.infer<typeof listPersonalEventsSchema>;
