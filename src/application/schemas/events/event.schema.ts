import { z } from "zod";

// Location schema for event location
export const LocationSchema = z.object({
  name: z.string().min(1).max(255),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
});

// Time option schema for voting
export const TimeOptionSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

// Create event schema
export const CreateEventSchema = z.object({
  circleId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  notes: z.string().optional(),
  location: LocationSchema.optional(),
  timeOptions: z.array(TimeOptionSchema).min(1).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  color: z.string().max(50).optional(),
  reminderMinutes: z.number().int().positive().optional(),
});

// Update event schema
export const UpdateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  location: LocationSchema.optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  color: z.string().max(50).optional(),
  reminderMinutes: z.number().int().positive().optional(),
});

// Vote for event time schema
export const VoteEventTimeSchema = z.object({
  eventTimeId: z.string().uuid(),
});

// Update RSVP status schema
export const UpdateRsvpSchema = z.object({
  status: z.enum(["going", "not going", "maybe"]),
});

// Lock event schema (when admin locks voting)
export const LockEventSchema = z.object({
  selectedTimeId: z.string().uuid(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type VoteEventTimeInput = z.infer<typeof VoteEventTimeSchema>;
export type UpdateRsvpInput = z.infer<typeof UpdateRsvpSchema>;
export type LockEventInput = z.infer<typeof LockEventSchema>;
export type LocationInput = z.infer<typeof LocationSchema>;
export type TimeOptionInput = z.infer<typeof TimeOptionSchema>;
