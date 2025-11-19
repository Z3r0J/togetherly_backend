import { Repository } from "typeorm";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
import { IEventRsvpRepository } from "@domain/ports/event.repository.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode, mapDatabaseError } from "@shared/errors/index.js";

/**
 * Event RSVP Repository
 */
export class EventRsvpRepository implements IEventRsvpRepository {
  constructor(private readonly repository: Repository<EventRsvp>) {}

  /**
   * Create or update RSVP
   */
  async upsert(rsvp: EventRsvp): Promise<Result<EventRsvp>> {
    try {
      const existing = await this.repository.findOne({
        where: {
          eventId: rsvp.eventId,
          userId: rsvp.userId,
          isDeleted: false,
        },
      });

      if (existing) {
        existing.status = rsvp.status;
        existing.updatedAt = new Date();
        const updated = await this.repository.save(existing);
        return Result.ok(updated);
      }

      const saved = await this.repository.save(rsvp);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error upserting RSVP";
      const errorCode = mapDatabaseError(error);
      return Result.fail(
        message,
        500,
        errorCode || ErrorCode.RSVP_UPDATE_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Find RSVP by event and user
   */
  async findByEventAndUser(
    eventId: string,
    userId: string
  ): Promise<Result<EventRsvp | null>> {
    try {
      const rsvp = await this.repository.findOne({
        where: { eventId, userId, isDeleted: false },
      });
      return Result.ok(rsvp);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error finding RSVP";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find all RSVPs for an event
   */
  async findByEventId(eventId: string): Promise<Result<EventRsvp[]>> {
    try {
      const rsvps = await this.repository.find({
        where: { eventId, isDeleted: false },
      });
      return Result.ok(rsvps);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error finding RSVPs";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count RSVPs by status
   */
  async countByStatus(
    eventId: string,
    status: "going" | "not going" | "maybe"
  ): Promise<Result<number>> {
    try {
      const count = await this.repository.count({
        where: { eventId, status, isDeleted: false },
      });
      return Result.ok(count);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error counting RSVPs";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Soft delete RSVP
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      await this.repository.update(id, {
        isDeleted: true,
        deletedAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error deleting RSVP";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
