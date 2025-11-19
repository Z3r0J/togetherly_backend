import { EntitySchema } from "typeorm";
import { EventTime } from "@domain/entities/events/event-time.entity.js";

/**
 * TypeORM schema for EventTime entity
 */
export const EventTimeSchema = new EntitySchema<EventTime>({
  name: "EventTime",
  tableName: "event_times",
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
    startTime: {
      type: "timestamp",
      name: "start_time",
    },
    endTime: {
      type: "timestamp",
      name: "end_time",
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
    // Relation to Event (many-to-one)
  },
  indices: [
    {
      name: "IDX_EVENT_TIME_EVENT",
      columns: ["eventId"],
    },
  ],
});
