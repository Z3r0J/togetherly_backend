import { Repository } from "typeorm";
import { Event } from "@domain/entities/events/event.entity.js";
import { EventTime } from "@domain/entities/events/event-time.entity.js";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
import { IEventRepository } from "@domain/ports/event.repository.js";
import { Result } from "@shared/types/Result.js";

/**
 * Event Repository
 */
export class EventRepository implements IEventRepository {
  constructor(
    private readonly repository: Repository<Event>,
    private readonly eventTimeRepository: Repository<EventTime>,
    private readonly rsvpRepository: Repository<EventRsvp>
  ) {}

  /**
   * Create a new event
   */
  async create(event: Event): Promise<Result<Event>> {
    try {
      const saved = await this.repository.save(event);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error creating event";
      return Result.fail(message, 500);
    }
  }

  /**
   * Find event by ID (not deleted)
   */
  async findById(id: string): Promise<Result<Event | null>> {
    try {
      const event = await this.repository.findOne({
        where: { id, isDeleted: false },
      });
      return Result.ok(event);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error finding event";
      return Result.fail(message, 500);
    }
  }

  /**
   * Find event by ID with relations
   */
  async findByIdWithDetails(id: string): Promise<Result<any>> {
    try {
      const event = await this.repository.findOne({
        where: { id, isDeleted: false },
      });

      if (!event) return Result.ok(null);

      // Get event times with vote counts
      const eventTimes = await this.eventTimeRepository
        .createQueryBuilder("eventTime")
        .leftJoin(
          "EventTimeVote",
          "vote",
          "vote.eventTimeId = eventTime.id AND vote.isDeleted = false"
        )
        .where("eventTime.eventId = :eventId", { eventId: id })
        .andWhere("eventTime.isDeleted = false")
        .select([
          "eventTime.id",
          "eventTime.startTime",
          "eventTime.endTime",
          "COUNT(vote.id) as voteCount",
        ])
        .groupBy("eventTime.id")
        .getRawMany();

      // Get RSVPs with user info
      const rsvps = await this.rsvpRepository
        .createQueryBuilder("rsvp")
        .leftJoin("User", "user", "user.id = rsvp.userId")
        .where("rsvp.eventId = :eventId", { eventId: id })
        .andWhere("rsvp.isDeleted = false")
        .select([
          "rsvp.id",
          "rsvp.userId",
          "rsvp.status",
          "user.username",
          "user.email",
        ])
        .getRawMany();

      const eventWithDetails = {
        ...event,
        eventTimes: eventTimes.map((et) => ({
          id: et.eventTime_id,
          startTime: et.eventTime_startTime,
          endTime: et.eventTime_endTime,
          voteCount: parseInt(et.voteCount) || 0,
        })),
        rsvps: rsvps.map((r) => ({
          id: r.rsvp_id,
          userId: r.rsvp_userId,
          status: r.rsvp_status,
          username: r.user_username,
          email: r.user_email,
        })),
      };

      return Result.ok(eventWithDetails);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding event details";
      return Result.fail(message, 500);
    }
  }

  /**
   * Find all events for a circle
   */
  async findByCircleId(circleId: string): Promise<Result<Event[]>> {
    try {
      const events = await this.repository.find({
        where: { circleId, isDeleted: false },
        order: { startsAt: "ASC" },
      });
      return Result.ok(events);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error finding events";
      return Result.fail(message, 500);
    }
  }

  /**
   * Update event
   */
  async update(event: Event): Promise<Result<Event>> {
    try {
      const updated = await this.repository.save(event);
      return Result.ok(updated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error updating event";
      return Result.fail(message, 500);
    }
  }

  /**
   * Soft delete event
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
        error instanceof Error ? error.message : "Unknown error deleting event";
      return Result.fail(message, 500);
    }
  }

  /**
   * Check if user is event creator
   */
  async isEventCreator(
    eventId: string,
    userId: string
  ): Promise<Result<boolean>> {
    try {
      const event = await this.repository.findOne({
        where: { id: eventId, userId, isDeleted: false },
      });
      return Result.ok(!!event);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error checking event creator";
      return Result.fail(message, 500);
    }
  }
}
