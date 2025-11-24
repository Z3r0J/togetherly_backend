import { EntitySchema } from "typeorm";
import { Circle } from "@domain/entities/circles/circle.entity.js";

/**
 * TypeORM schema for Circle entity
 * Maps pure domain entity to database
 */
export const CircleSchema = new EntitySchema<Circle>({
  name: "Circle",
  tableName: "circles",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    name: {
      type: "nvarchar",
      length: 255,
    },
    description: {
      type: "text",
      nullable: true,
    },
    color: {
      type: "nvarchar",
      length: 50,
      nullable: true,
    },
    privacy: {
      type: "enum",
      enum: ["public", "invite-only"],
      default: "invite-only",
    },
    shareToken: {
      type: "varchar",
      length: 64,
      nullable: true,
      unique: true,
    },
    ownerId: {
      type: "uuid",
      name: "owner_id",
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
    owner: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "owner_id",
      },
    },
    events: {
      type: "one-to-many",
      target: "Event",
      inverseSide: "circle",
    },
  },
  indices: [
    {
      name: "IDX_CIRCLE_OWNER",
      columns: ["ownerId"],
    },
    {
      name: "IDX_CIRCLE_SHARE_TOKEN",
      columns: ["shareToken"],
    },
  ],
});
