import { DataSource, Repository, Between } from "typeorm";
import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode, mapDatabaseError } from "@shared/errors/index.js";

/**
 * Personal Event Repository Implementation
 */
export class PersonalEventRepository implements IPersonalEventRepository {
  private repository: Repository<PersonalEvent>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository("PersonalEvent");
  }

  async create(event: PersonalEvent): Promise<Result<PersonalEvent>> {
    try {
      const saved = await this.repository.save(event);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating personal event";
      const errorCode = mapDatabaseError(error);
      return Result.fail(
        message,
        500,
        errorCode || ErrorCode.PERSONAL_EVENT_CREATE_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async findById(id: string): Promise<Result<PersonalEvent | null>> {
    try {
      const event = await this.repository.findOne({
        where: { id, isDeleted: false },
      });
      return Result.ok(event);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding personal event";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByUserId(userId: string): Promise<Result<PersonalEvent[]>> {
    try {
      const events = await this.repository.find({
        where: { userId, isDeleted: false },
        order: { startTime: "ASC" },
      });
      return Result.ok(events);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding personal events";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<PersonalEvent[]>> {
    try {
      const events = await this.repository.find({
        where: {
          userId,
          isDeleted: false,
          startTime: Between(startDate, endDate),
        },
        order: { startTime: "ASC" },
      });
      return Result.ok(events);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding personal events by date range";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async update(
    id: string,
    updates: Partial<PersonalEvent>
  ): Promise<Result<PersonalEvent | null>> {
    try {
      await this.repository.update(id, updates);
      const updated = await this.repository.findOne({
        where: { id, isDeleted: false },
      });
      return Result.ok(updated);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error updating personal event";
      const errorCode = mapDatabaseError(error);
      return Result.fail(
        message,
        500,
        errorCode || ErrorCode.PERSONAL_EVENT_UPDATE_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async softDelete(id: string): Promise<Result<void>> {
    try {
      await this.repository.update(id, {
        isDeleted: true,
        deletedAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deleting personal event";
      const errorCode = mapDatabaseError(error);
      return Result.fail(
        message,
        500,
        errorCode || ErrorCode.PERSONAL_EVENT_DELETE_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Check for overlapping events for a user
   * Returns events that overlap with the given time range
   */
  async checkOverlap(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<Result<PersonalEvent[]>> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder("event")
        .where("event.userId = :userId", { userId })
        .andWhere("event.isDeleted = :isDeleted", { isDeleted: false })
        .andWhere("event.cancelled = :cancelled", { cancelled: false })
        .andWhere(
          "(event.startTime < :endTime AND event.endTime > :startTime)",
          { startTime, endTime }
        );

      if (excludeEventId) {
        queryBuilder.andWhere("event.id != :excludeEventId", {
          excludeEventId,
        });
      }

      const overlappingEvents = await queryBuilder.getMany();
      return Result.ok(overlappingEvents);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error checking event overlap";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
