/**
 * Circle Invitation Entity
 * @author Jean Carlos Reyes
 * @description Represents an invitation to join a circle
 * @version 1.0.0
 */

import { Circle } from "./circle.entity.js";
import { User } from "../account/user.entity.js";

export type InvitationStatus = "pending" | "accepted" | "expired" | "declined";
export type InvitationType = "email" | "link";

export interface CircleInvitation {
  id?: string;
  circleId: string;
  invitedEmail: string;
  invitedBy: string; // userId of the person who sent the invitation
  token: string; // unique token for the invitation link
  type: InvitationType; // email sent or link-only
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date | null;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;

  // Relations
  circle?: Circle;
  inviter?: User;
}

export const createCircleInvitation = (
  props: Omit<
    CircleInvitation,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "isDeleted"
    | "deletedAt"
    | "acceptedAt"
    | "status"
  >
): CircleInvitation => {
  return {
    circleId: props.circleId,
    invitedEmail: props.invitedEmail,
    invitedBy: props.invitedBy,
    token: props.token,
    type: props.type || "email",
    status: "pending",
    expiresAt: props.expiresAt,
  };
};
