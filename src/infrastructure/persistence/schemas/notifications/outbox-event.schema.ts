import { EntitySchema } from "typeorm";
import { OutboxEvent } from "@domain/entities/index.js";

export const OutboxEventSchema = new EntitySchema<OutboxEvent>({
  name: "OutboxEvent",
  tableName: "outbox_events",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    aggregateType: {
      type: "varchar",
      length: 50,
      name: "aggregate_type",
      nullable: false,
    },
    aggregateId: {
      type: "varchar",
      length: 100,
      name: "aggregate_id",
      nullable: false,
    },
    eventType: {
      type: "varchar",
      length: 100,
      name: "event_type",
      nullable: false,
    },
    payload: {
      type: "simple-json",
      nullable: false,
    },
    status: {
      type: "enum",
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    retryCount: {
      type: "int",
      name: "retry_count",
      default: 0,
    },
    maxRetries: {
      type: "int",
      name: "max_retries",
      default: 3,
    },
    lastError: {
      type: "text",
      name: "last_error",
      nullable: true,
    },
    processedAt: {
      type: "timestamp",
      name: "processed_at",
      nullable: true,
    },
    scheduledFor: {
      type: "timestamp",
      name: "scheduled_for",
      nullable: true,
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
  },
  indices: [
    {
      name: "IDX_OUTBOX_STATUS_CREATED",
      columns: ["status", "createdAt"],
    },
    {
      name: "IDX_OUTBOX_SCHEDULED",
      columns: ["scheduledFor", "status"],
    },
    {
      name: "IDX_OUTBOX_AGGREGATE",
      columns: ["aggregateType", "aggregateId"],
    },
  ],
});
