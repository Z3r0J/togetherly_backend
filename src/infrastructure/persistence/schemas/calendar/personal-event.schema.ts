import { EntitySchema } from "typeorm";
import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";

/**
 * TypeORM schema for PersonalEvent entity
 * Maps pure domain entity to database
 */
export const PersonalEventSchema = new EntitySchema<PersonalEvent>({
  name: "PersonalEvent",
  tableName: "personal_events",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      name: "user_id",
    },
    title: {
      type: "nvarchar",
      length: 255,
    },
    date: {
      type: "timestamp",
    },
    startTime: {
      type: "timestamp",
      name: "start_time",
    },
    endTime: {
      type: "timestamp",
      name: "end_time",
    },
    allDay: {
      type: "boolean",
      name: "all_day",
      default: false,
    },
    location: {
      type: "simple-json",
      nullable: true,
    },
    notes: {
      type: "text",
      nullable: true,
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
    isDeleted: {
      type: "boolean",
      name: "is_deleted",
      default: false,
    },
    createdAt: {
      type: "timestamp",
      name: "created_at",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      name: "updated_at",
      updateDate: true,
    },
    deletedAt: {
      type: "timestamp",
      name: "deleted_at",
      nullable: true,
    },
  },
  relations: {
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
      name: "IDX_PERSONAL_EVENT_USER",
      columns: ["userId"],
    },
    {
      name: "IDX_PERSONAL_EVENT_DATE",
      columns: ["date"],
    },
    {
      name: "IDX_PERSONAL_EVENT_START_TIME",
      columns: ["startTime"],
    },
    {
      name: "IDX_PERSONAL_EVENT_USER_DATE",
      columns: ["userId", "date"],
    },
  ],
});
