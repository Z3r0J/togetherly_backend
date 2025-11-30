/**
 * Personal Event Calendar Entity
 * @author Jean Carlos Reyes
 * @description Represents a personal calendar event for a user
 * @version 1.0.0
 */

import { User } from "../account/user.entity.js";

export interface PersonalEvent {
  id?: string;
  userId: string;
  title: string;
  date: Date; // Event date
  startTime: Date; // Start time (can be same as date if all-day)
  endTime: Date; // End time
  allDay?: boolean;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  notes?: string; // Previously description
  color?: string;
  reminderMinutes?: number; // Minutes before event (e.g., 15, 30, 60)
  cancelled?: boolean;
  cancelledAt?: Date | null;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  user?: User;
}

export const createPersonalEvent = (
  props: Omit<
    PersonalEvent,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): PersonalEvent => {
  return {
    userId: props.userId,
    title: props.title,
    date: props.date,
    startTime: props.startTime,
    endTime: props.endTime,
    allDay: props.allDay || false,
    location: props.location,
    notes: props.notes,
    color: props.color,
    reminderMinutes: props.reminderMinutes,
    cancelled: props.cancelled || false,
    cancelledAt: props.cancelledAt || null,
  };
};
