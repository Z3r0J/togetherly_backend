/**
 * Represents the event time votes by users to select the best time for an event.
 * @author Jean Carlos Reyes
 * @version 1.0.0
 */
import { EventTime } from "./event-time.entity.js";
import { User } from "../account/user.entity.js";

export interface EventTimeVote {
  id?: string;
  eventTimeId: string;
  userId: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  eventTime?: EventTime;
  user?: User;
}
export const createEventTimeVote = (
  props: Omit<
    EventTimeVote,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): EventTimeVote => {
  return {
    eventTimeId: props.eventTimeId,
    userId: props.userId,
  };
};
