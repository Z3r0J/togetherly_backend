/**
 * Represents options to select the best event time based on votes.
 * @author Jean Carlos Reyes
 * @version 1.0.0
 */
export interface EventTime {
  id?: string;
  eventId: string;
  startTime: Date;
  endTime: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export const createEventTime = (
  props: Omit<
    EventTime,
    "id" | "createdAt" | "updatedAt" | "isDeleted" | "deletedAt"
  >
): EventTime => {
  return {
    eventId: props.eventId,
    startTime: props.startTime,
    endTime: props.endTime,
  };
};
