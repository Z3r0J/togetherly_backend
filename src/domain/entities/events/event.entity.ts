/**
 * Event entity
 * Represents an event in the friend circle application.
 * @author Jean Carlos Reyes
 * @version 1.0.0
 */

import { Circle } from "../circles/circle.entity.js";
import { User } from "../account/user.entity.js";
export interface Event {
  id?: string;
  circleId: string;
  title: string;
  description?: string; // Keep for backward compatibility or internal use
  notes?: string; // User-facing notes field (matches UI)
  location?: {
    name: string; // Required when location is set
    longitude?: number;
    latitude?: number;
  };
  userId: string;
  startsAt?: Date;
  endsAt?: Date;
  allDay?: boolean; // All-day event toggle
  color?: string; // Color tag for the event
  reminderMinutes?: number; // Reminder time in minutes (15, 30, 60, etc.)
  status?: "draft" | "locked" | "finalized";
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  circle?: Circle;
  user?: User;
}

export const createEvent = (
  props: Omit<
    Event,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): Event => {
  return {
    circleId: props.circleId,
    title: props.title,
    description: props.description,
    notes: props.notes,
    location: props.location,
    startsAt: props.startsAt,
    endsAt: props.endsAt,
    allDay: props.allDay,
    color: props.color,
    reminderMinutes: props.reminderMinutes,
    status: props.status,
    userId: props.userId,
  };
};
