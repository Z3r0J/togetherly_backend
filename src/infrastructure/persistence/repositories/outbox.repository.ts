import { DataSource, Repository, In, LessThanOrEqual, LessThan } from "typeorm";
import { IOutboxRepository } from "@domain/ports/notification.repository.js";
import { OutboxEvent } from "@domain/entities/index.js";
import { OutboxEventSchema } from "../schemas/notifications/outbox-event.schema.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/error-codes.js";
import { mapDatabaseError } from "@shared/errors/error-mapper.js";

/**
 * Outbox Event Repository Implementation
 */
export class OutboxRepository implements IOutboxRepository {
  private repository: Repository<OutboxEvent>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(OutboxEventSchema);
  }

  async create(event: OutboxEvent): Promise<Result<OutboxEvent>> {
    try {
      const saved = await this.repository.save(event);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating outbox event";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findPending(limit: number = 100): Promise<Result<OutboxEvent[]>> {
    try {
      const events = await this.repository.find({
        where: {
          status: In(["pending"]),
          scheduledFor: LessThanOrEqual(new Date()) as any,
        },
        order: { createdAt: "ASC" },
        take: limit,
      });
      return Result.ok(events);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding pending outbox events";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findScheduled(
    beforeDate: Date,
    limit: number = 100
  ): Promise<Result<OutboxEvent[]>> {
    try {
      const events = await this.repository.find({
        where: {
          status: "pending",
          scheduledFor: LessThanOrEqual(beforeDate) as any,
        },
        order: { scheduledFor: "ASC" },
        take: limit,
      });
      return Result.ok(events);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding scheduled outbox events";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async markProcessing(eventId: string): Promise<Result<void>> {
    try {
      await this.repository.update(eventId, { status: "processing" });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error marking outbox event as processing";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async markCompleted(eventId: string): Promise<Result<void>> {
    try {
      await this.repository.update(eventId, {
        status: "completed",
        processedAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error marking outbox event as completed";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async markFailed(eventId: string, error: string): Promise<Result<void>> {
    try {
      await this.repository.update(eventId, {
        status: "failed",
        lastError: error,
        processedAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error marking outbox event as failed";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async incrementRetry(eventId: string): Promise<Result<void>> {
    try {
      await this.repository.increment({ id: eventId }, "retryCount", 1);
      await this.repository.update(eventId, { status: "pending" });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error incrementing retry count";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async deleteOld(daysOld: number): Promise<Result<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.repository.delete({
        status: In(["completed", "failed"]),
        processedAt: LessThan(cutoffDate) as any,
      });

      return Result.ok(result.affected || 0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deleting old outbox events";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
