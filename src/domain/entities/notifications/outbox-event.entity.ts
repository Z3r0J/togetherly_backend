/**
 * Outbox Event Entity
 * @author Jean Carlos Reyes
 * @description Represents an event in the outbox for async processing
 * @version 1.0.0
 */

export type OutboxEventType =
  | "notification.push"
  | "notification.email"
  | "notification.reminder"
  | "email.invitation"
  | "email.magic_link"
  | "rsvp.auto_create";

export type OutboxEventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface OutboxEvent {
  id?: string;
  aggregateType: string; // e.g., "event", "circle", "notification"
  aggregateId: string; // ID of the related entity
  eventType: OutboxEventType;
  payload: any; // JSON payload with event data
  status: OutboxEventStatus;
  retryCount: number;
  maxRetries: number;
  lastError?: string | null;
  processedAt?: Date | null;
  scheduledFor?: Date | null; // For delayed processing (reminders)
  createdAt?: Date;
  updatedAt?: Date;
}

export const createOutboxEvent = (
  props: Omit<
    OutboxEvent,
    "id" | "createdAt" | "updatedAt" | "status" | "retryCount" | "processedAt"
  >
): OutboxEvent => {
  return {
    aggregateType: props.aggregateType,
    aggregateId: props.aggregateId,
    eventType: props.eventType,
    payload: props.payload,
    status: "pending",
    retryCount: 0,
    maxRetries: props.maxRetries,
    lastError: props.lastError,
    scheduledFor: props.scheduledFor,
  };
};
