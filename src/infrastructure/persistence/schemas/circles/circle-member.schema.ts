import { EntitySchema } from "typeorm";
import { CircleMember } from "@domain/entities/circles/circle-members.entity.js";

/**
 * TypeORM schema for CircleMember entity
 * Maps pure domain entity to database
 */
export const CircleMemberSchema = new EntitySchema<CircleMember>({
  name: "CircleMember",
  tableName: "circle_members",
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
    userId: {
      type: "uuid",
      name: "user_id",
    },
    role: {
      type: "enum",
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
    deletedAt: {
      type: "timestamp",
      nullable: true,
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
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "user_id",
      },
    },
  },
  indices: [
    {
      name: "IDX_CIRCLE_MEMBER_CIRCLE",
      columns: ["circleId"],
    },
    {
      name: "IDX_CIRCLE_MEMBER_USER",
      columns: ["userId"],
    },
    {
      name: "IDX_CIRCLE_MEMBER_UNIQUE",
      columns: ["circleId", "userId"],
      unique: true,
    },
  ],
});
