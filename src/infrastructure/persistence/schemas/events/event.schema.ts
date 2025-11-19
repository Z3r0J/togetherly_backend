import { EntitySchema } from "typeorm";
import { Event } from "@domain/entities/events/event.entity.js";

/**
 * TypeORM schema for Event entity
 */
export const EventSchema = new EntitySchema<Event>({
  name: "Event",
  tableName: "events",
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
    title: {
      type: "nvarchar",
      length: 255,
    },
    description: {
      type: "text",
      nullable: true,
    },
    notes: {
      type: "text",
      nullable: true,
    },
    location: {
      type: "simple-json",
      nullable: true,
    },
    userId: {
      type: "uuid",
      name: "user_id",
    },
    startsAt: {
      type: "timestamp",
      name: "starts_at",
      nullable: true,
    },
    endsAt: {
      type: "timestamp",
      name: "ends_at",
      nullable: true,
    },
    allDay: {
      type: Boolean,
      name: "all_day",
      default: false,
    },
    color: {
      type: "nvarchar",
      length: 50,
      nullable: true,
    },
    reminderMinutes: {
      type: "int",
      name: "reminder_minutes",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: ["draft", "locked", "finalized"],
      default: "draft",
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
      name: "IDX_EVENT_CIRCLE",
      columns: ["circleId"],
    },
    {
      name: "IDX_EVENT_USER",
      columns: ["userId"],
    },
    {
      name: "IDX_EVENT_STARTS_AT",
      columns: ["startsAt"],
    },
  ],
});
