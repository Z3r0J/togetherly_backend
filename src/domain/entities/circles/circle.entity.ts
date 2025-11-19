/**
 * Circle Entity
 * @author Jean Carlos Reyes
 * @description Represents a circle in the system.
 * @version 1.0.0
 */

import { User } from "../account/user.entity.js";
import { Event } from "../events/event.entity.js";

export interface Circle {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  privacy?: "public" | "invite-only";
  ownerId: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  owner?: User;
  events?: Event[];
}

export const createCircle = (
  props: Omit<
    Circle,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): Circle => {
  return {
    name: props.name,
    description: props.description,
    ownerId: props.ownerId,
  };
};
