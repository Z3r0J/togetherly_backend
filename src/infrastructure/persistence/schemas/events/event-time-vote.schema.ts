import { EntitySchema } from "typeorm";
import { EventTimeVote } from "@domain/entities/events/event-time-votes.entity.js";

/**
 * TypeORM schema for EventTimeVote entity
 */
export const EventTimeVoteSchema = new EntitySchema<EventTimeVote>({
  name: "EventTimeVote",
  tableName: "event_time_votes",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    eventTimeId: {
      type: "uuid",
      name: "event_time_id",
    },
    userId: {
      type: "uuid",
      name: "user_id",
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
    eventTime: {
      type: "many-to-one",
      target: "EventTime",
      joinColumn: {
        name: "event_time_id",
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
      name: "IDX_EVENT_TIME_VOTE_TIME",
      columns: ["eventTimeId"],
    },
    {
      name: "IDX_EVENT_TIME_VOTE_USER",
      columns: ["userId"],
    },
    {
      name: "IDX_EVENT_TIME_VOTE_UNIQUE",
      columns: ["eventTimeId", "userId"],
      unique: true,
    },
  ],
});
