import { EntitySchema } from "typeorm";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";

/**
 * TypeORM schema for EventRsvp entity
 */
export const EventRsvpSchema = new EntitySchema<EventRsvp>({
  name: "EventRsvp",
  tableName: "event_rsvps",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    eventId: {
      type: "uuid",
      name: "event_id",
    },
    userId: {
      type: "uuid",
      name: "user_id",
    },
    status: {
      type: "enum",
      enum: ["going", "not going", "maybe"],
      default: "maybe",
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
    event: {
      type: "many-to-one",
      target: "Event",
      joinColumn: {
        name: "event_id",
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
      name: "IDX_EVENT_RSVP_EVENT",
      columns: ["eventId"],
    },
    {
      name: "IDX_EVENT_RSVP_USER",
      columns: ["userId"],
    },
    {
      name: "IDX_EVENT_RSVP_UNIQUE",
      columns: ["eventId", "userId"],
      unique: true,
    },
  ],
});
