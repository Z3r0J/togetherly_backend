import { Repository } from "typeorm";
import { EventTime } from "@domain/entities/events/event-time.entity.js";
import { IEventTimeRepository } from "@domain/ports/event.repository.js";
import { Result } from "@shared/types/Result.js";

/**
 * Event Time Repository
 */
export class EventTimeRepository implements IEventTimeRepository {
  constructor(private readonly repository: Repository<EventTime>) {}

  /**
   * Create event time option
   */
  async create(eventTime: EventTime): Promise<Result<EventTime>> {
    try {
      const saved = await this.repository.save(eventTime);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating event time";
      return Result.fail(message, 500);
    }
  }

  /**
   * Create multiple time options
   */
  async createMany(eventTimes: EventTime[]): Promise<Result<EventTime[]>> {
    try {
      const saved = await this.repository.save(eventTimes);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating event times";
      return Result.fail(message, 500);
    }
  }

  /**
   * Find time option by ID
   */
  async findById(id: string): Promise<Result<EventTime | null>> {
    try {
      const eventTime = await this.repository.findOne({
        where: { id, isDeleted: false },
      });
      return Result.ok(eventTime);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding event time";
      return Result.fail(message, 500);
    }
  }

  /**
   * Find all time options for an event
   */
  async findByEventId(eventId: string): Promise<Result<EventTime[]>> {
    try {
      const eventTimes = await this.repository.find({
        where: { eventId, isDeleted: false },
        order: { startTime: "ASC" },
      });
      return Result.ok(eventTimes);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding event times";
      return Result.fail(message, 500);
    }
  }

  /**
   * Find time option with vote count
   */
  async findByIdWithVoteCount(id: string): Promise<
    Result<{
      eventTime: EventTime;
      voteCount: number;
    } | null>
  > {
    try {
      const result = await this.repository
        .createQueryBuilder("eventTime")
        .leftJoin(
          "EventTimeVote",
          "vote",
          "vote.eventTimeId = eventTime.id AND vote.isDeleted = false"
        )
        .where("eventTime.id = :id", { id })
        .andWhere("eventTime.isDeleted = false")
        .select([
          "eventTime.id",
          "eventTime.eventId",
          "eventTime.startTime",
          "eventTime.endTime",
          "COUNT(vote.id) as voteCount",
        ])
        .groupBy("eventTime.id")
        .getRawOne();

      if (!result) return Result.ok(null);

      const data = {
        eventTime: {
          id: result.eventTime_id,
          eventId: result.eventTime_eventId,
          startTime: result.eventTime_startTime,
          endTime: result.eventTime_endTime,
        } as EventTime,
        voteCount: parseInt(result.voteCount) || 0,
      };
      return Result.ok(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding event time with vote count";
      return Result.fail(message, 500);
    }
  }

  /**
   * Find time option with most votes
   */
  async findWinningTime(eventId: string): Promise<Result<EventTime | null>> {
    try {
      const result = await this.repository
        .createQueryBuilder("eventTime")
        .leftJoin(
          "EventTimeVote",
          "vote",
          "vote.eventTimeId = eventTime.id AND vote.isDeleted = false"
        )
        .where("eventTime.eventId = :eventId", { eventId })
        .andWhere("eventTime.isDeleted = false")
        .select([
          "eventTime.id",
          "eventTime.eventId",
          "eventTime.startTime",
          "eventTime.endTime",
          "COUNT(vote.id) as voteCount",
        ])
        .groupBy("eventTime.id")
        .orderBy("voteCount", "DESC")
        .addOrderBy("eventTime.startTime", "ASC")
        .limit(1)
        .getRawOne();

      if (!result) return Result.ok(null);

      const eventTime = {
        id: result.eventTime_id,
        eventId: result.eventTime_eventId,
        startTime: result.eventTime_startTime,
        endTime: result.eventTime_endTime,
      } as EventTime;
      return Result.ok(eventTime);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding winning time";
      return Result.fail(message, 500);
    }
  }

  /**
   * Delete all time options for an event
   */
  async deleteByEventId(eventId: string): Promise<Result<void>> {
    try {
      await this.repository.update(
        { eventId },
        {
          isDeleted: true,
          deletedAt: new Date(),
        }
      );
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deleting event times";
      return Result.fail(message, 500);
    }
  }

  /**
   * Soft delete time option
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
        error instanceof Error
          ? error.message
          : "Unknown error deleting event time";
      return Result.fail(message, 500);
    }
  }
}
