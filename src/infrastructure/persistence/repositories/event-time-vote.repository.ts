import { Repository } from "typeorm";
import { EventTimeVote } from "@domain/entities/events/event-time-votes.entity.js";
import { IEventTimeVoteRepository } from "@domain/ports/event.repository.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode, mapDatabaseError } from "@shared/errors/index.js";

/**
 * Event Time Vote Repository
 */
export class EventTimeVoteRepository implements IEventTimeVoteRepository {
  constructor(private readonly repository: Repository<EventTimeVote>) {}

  /**
   * Create or update vote
   */
  async upsert(vote: EventTimeVote): Promise<Result<EventTimeVote>> {
    try {
      const existing = await this.repository.findOne({
        where: {
          eventTimeId: vote.eventTimeId,
          userId: vote.userId,
          isDeleted: false,
        },
      });

      if (existing) {
        // If user votes for same time, return existing
        return Result.ok(existing);
      }

      const saved = await this.repository.save(vote);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error upserting vote";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.VOTE_FAILED, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find user's vote for an event (across all time options)
   */
  async findUserVoteForEvent(
    eventId: string,
    userId: string
  ): Promise<Result<EventTimeVote | null>> {
    try {
      const result = await this.repository
        .createQueryBuilder("vote")
        .innerJoin("EventTime", "eventTime", "eventTime.id = vote.eventTimeId")
        .where("eventTime.eventId = :eventId", { eventId })
        .andWhere("vote.userId = :userId", { userId })
        .andWhere("vote.isDeleted = false")
        .andWhere("eventTime.isDeleted = false")
        .select(["vote.id", "vote.eventTimeId", "vote.userId"])
        .getOne();

      return Result.ok(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding user vote";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Remove user's previous votes for an event
   */
  async removeUserVotesForEvent(
    eventId: string,
    userId: string
  ): Promise<Result<void>> {
    try {
      // First, get all event time IDs for this event
      const eventTimes = await this.repository
        .createQueryBuilder("vote")
        .innerJoin("EventTime", "eventTime", "eventTime.id = vote.eventTimeId")
        .where("eventTime.eventId = :eventId", { eventId })
        .andWhere("vote.userId = :userId", { userId })
        .andWhere("vote.isDeleted = false")
        .getMany();

      // Soft delete all votes
      if (eventTimes.length > 0) {
        const voteIds = eventTimes
          .map((v) => v.id)
          .filter((id): id is string => id !== undefined);
        await this.repository.update(voteIds, {
          isDeleted: true,
          deletedAt: new Date(),
        });
      }
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error removing user votes";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count votes for a time option
   */
  async countByEventTimeId(eventTimeId: string): Promise<Result<number>> {
    try {
      const count = await this.repository.count({
        where: { eventTimeId, isDeleted: false },
      });
      return Result.ok(count);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error counting votes";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find all votes for a time option
   */
  async findByEventTimeId(
    eventTimeId: string
  ): Promise<Result<EventTimeVote[]>> {
    try {
      const votes = await this.repository.find({
        where: { eventTimeId, isDeleted: false },
      });
      return Result.ok(votes);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error finding votes";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Soft delete vote
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
        error instanceof Error ? error.message : "Unknown error deleting vote";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
