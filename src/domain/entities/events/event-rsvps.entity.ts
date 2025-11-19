/**
 * Event RSVPs Entity
 * @description Represents an RSVP for an event in the system.
 * @author Jean Carlos Reyes
 * @version 1.0.0
 */
import { Event } from "./event.entity.js";
import { User } from "../account/user.entity.js";
export interface EventRsvp {
  id?: string;
  eventId: string;
  userId: string;
  status: "going" | "not going" | "maybe";
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  event?: Event;
  user?: User;
}

export const createEventRsvp = (
  props: Omit<
    EventRsvp,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): EventRsvp => {
  return {
    eventId: props.eventId,
    userId: props.userId,
    status: props.status,
  };
};
