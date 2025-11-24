/**
 * Circle Member Entity
 * @author Jean Carlos Reyes
 * @description Represents a member of a circle in the system.
 * @version 1.0.0
 */

import { Circle, User } from "../index.js";

export interface CircleMember {
  id?: string;
  circleId: string;
  userId: string;
  role: "member" | "admin" | "owner";
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  user?: User;
  circle?: Circle;
}

export const createCircleMember = (
  props: Omit<
    CircleMember,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): CircleMember => {
  return {
    circleId: props.circleId,
    userId: props.userId,
    role: props.role,
  };
};
