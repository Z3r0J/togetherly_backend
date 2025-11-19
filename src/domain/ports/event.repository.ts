import { Event } from "@domain/entities/events/event.entity.js";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
import { EventTime } from "@domain/entities/events/event-time.entity.js";
import { EventTimeVote } from "@domain/entities/events/event-time-votes.entity.js";
import { Result } from "@shared/types/Result.js";

/**
 * Event Repository Port
 */
export interface IEventRepository {
  create(event: Event): Promise<Result<Event>>;
  findById(id: string): Promise<Result<Event | null>>;
  findByIdWithDetails(id: string): Promise<Result<any>>;
  findByCircleId(circleId: string): Promise<Result<Event[]>>;
  update(event: Event): Promise<Result<Event>>;
  delete(id: string): Promise<Result<void>>;
  isEventCreator(eventId: string, userId: string): Promise<Result<boolean>>;
}

/**
 * Event RSVP Repository Port
 */
export interface IEventRsvpRepository {
  upsert(rsvp: EventRsvp): Promise<Result<EventRsvp>>;
  findByEventAndUser(
    eventId: string,
    userId: string
  ): Promise<Result<EventRsvp | null>>;
  findByEventId(eventId: string): Promise<Result<EventRsvp[]>>;
  countByStatus(
    eventId: string,
    status: "going" | "not going" | "maybe"
  ): Promise<Result<number>>;
  delete(id: string): Promise<Result<void>>;
}

/**
 * Event Time Repository Port
 */
export interface IEventTimeRepository {
  create(eventTime: EventTime): Promise<Result<EventTime>>;
  createMany(eventTimes: EventTime[]): Promise<Result<EventTime[]>>;
  findById(id: string): Promise<Result<EventTime | null>>;
  findByEventId(eventId: string): Promise<Result<EventTime[]>>;
  findByIdWithVoteCount(
    id: string
  ): Promise<Result<{ eventTime: EventTime; voteCount: number } | null>>;
  findWinningTime(eventId: string): Promise<Result<EventTime | null>>;
  deleteByEventId(eventId: string): Promise<Result<void>>;
  delete(id: string): Promise<Result<void>>;
}

/**
 * Event Time Vote Repository Port
 */
export interface IEventTimeVoteRepository {
  upsert(vote: EventTimeVote): Promise<Result<EventTimeVote>>;
  findUserVoteForEvent(
    eventId: string,
    userId: string
  ): Promise<Result<EventTimeVote | null>>;
  removeUserVotesForEvent(
    eventId: string,
    userId: string
  ): Promise<Result<void>>;
  countByEventTimeId(eventTimeId: string): Promise<Result<number>>;
  findByEventTimeId(eventTimeId: string): Promise<Result<EventTimeVote[]>>;
  delete(id: string): Promise<Result<void>>;
}
