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
  description?: string;
  location?: {
    longitude: number;
    latitude: number;
    name?: string;
  };
  userId: string;
  startsAt?: Date;
  endsAt?: Date;
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
    location: props.location,
    startsAt: props.startsAt,
    endsAt: props.endsAt,
    status: props.status,
    userId: props.userId,
  };
};
