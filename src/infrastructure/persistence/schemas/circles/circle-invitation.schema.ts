import { EntitySchema } from "typeorm";
import { CircleInvitation } from "@domain/entities/circles/circle-invitation.entity.js";

/**
 * TypeORM schema for CircleInvitation entity
 * Maps pure domain entity to database
 */
export const CircleInvitationSchema = new EntitySchema<CircleInvitation>({
  name: "CircleInvitation",
  tableName: "circle_invitations",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    circleId: {
      type: "uuid",
      name: "circle_id",
    },
    invitedEmail: {
      type: "nvarchar",
      length: 255,
      name: "invited_email",
    },
    invitedBy: {
      type: "uuid",
      name: "invited_by",
    },
    token: {
      type: "nvarchar",
      length: 255,
      unique: true,
    },
    type: {
      type: "enum",
      enum: ["email", "link"],
      default: "email",
    },
    status: {
      type: "enum",
      enum: ["pending", "accepted", "expired", "declined"],
      default: "pending",
    },
    expiresAt: {
      type: "timestamp",
      name: "expires_at",
    },
    acceptedAt: {
      type: "timestamp",
      name: "accepted_at",
      nullable: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      name: "is_deleted",
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      name: "created_at",
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
      name: "updated_at",
    },
    deletedAt: {
      type: "timestamp",
      nullable: true,
      name: "deleted_at",
    },
  },
  relations: {
    circle: {
      type: "many-to-one",
      target: "Circle",
      joinColumn: {
        name: "circle_id",
      },
    },
    inviter: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "invited_by",
      },
    },
  },
  indices: [
    {
      name: "IDX_CIRCLE_INVITATION_TOKEN",
      columns: ["token"],
      unique: true,
    },
    {
      name: "IDX_CIRCLE_INVITATION_CIRCLE",
      columns: ["circleId"],
    },
    {
      name: "IDX_CIRCLE_INVITATION_EMAIL",
      columns: ["invitedEmail"],
    },
    {
      name: "IDX_CIRCLE_INVITATION_CIRCLE_EMAIL",
      columns: ["circleId", "invitedEmail"],
    },
    {
      name: "IDX_CIRCLE_INVITATION_STATUS",
      columns: ["status"],
    },
    {
      name: "IDX_CIRCLE_INVITATION_EXPIRES",
      columns: ["expiresAt"],
    },
  ],
});
