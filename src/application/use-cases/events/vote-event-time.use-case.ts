import { randomUUID } from "crypto";
import { EventTimeVote } from "@domain/entities/events/event-time-votes.entity.js";
import {
  IEventTimeVoteRepository,
  IEventTimeRepository,
  IEventRepository,
} from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { VoteEventTimeInput } from "@app/schemas/events/event.schema.js";
import { Result } from "@shared/types/Result.js";

/**
 * Vote Event Time Use Case
 * Allows user to vote for a time option (one vote per user per event)
 */
export class VoteEventTimeUseCase {
  constructor(
    private readonly voteRepository: IEventTimeVoteRepository,
    private readonly eventTimeRepository: IEventTimeRepository,
    private readonly eventRepository: IEventRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(
    userId: string,
    eventId: string,
    input: VoteEventTimeInput
  ): Promise<Result<{ vote: EventTimeVote; winningTime: any }>> {
    // Find event
    const eventResult = await this.eventRepository.findById(eventId);

    if (!eventResult.ok) {
      return eventResult;
    }

    const event = eventResult.data;

    if (!event) {
      return Result.fail("Event not found");
    }

    // Check event status
    if (event.status === "finalized") {
      return Result.fail("Cannot vote on finalized event");
    }

    if (event.status === "locked") {
      return Result.fail("Voting is locked for this event");
    }

    // Verify user is member of the circle
    const membershipResult = await this.circleMemberRepository.findMember(
      event.circleId,
      userId
    );

    if (!membershipResult.ok || !membershipResult.data) {
      return Result.fail("You are not a member of this circle");
    }

    // Verify time option belongs to this event
    const eventTimeResult = await this.eventTimeRepository.findById(
      input.eventTimeId
    );

    if (!eventTimeResult.ok) {
      return eventTimeResult;
    }

    const eventTime = eventTimeResult.data;

    if (!eventTime || eventTime.eventId !== eventId) {
      return Result.fail("Invalid time option for this event");
    }

    // Remove user's previous vote for this event (if any)
    const removeResult = await this.voteRepository.removeUserVotesForEvent(
      eventId,
      userId
    );
    if (!removeResult.ok) {
      return Result.fail(removeResult.error);
    }

    // Create new vote
    const vote: EventTimeVote = {
      id: randomUUID(),
      eventTimeId: input.eventTimeId,
      userId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const savedVoteResult = await this.voteRepository.upsert(vote);
    if (!savedVoteResult.ok) {
      return savedVoteResult;
    }

    // Get current winning time
    const winningTimeResult = await this.eventTimeRepository.findWinningTime(
      eventId
    );
    if (!winningTimeResult.ok) {
      return Result.fail(winningTimeResult.error);
    }

    const winningTime = winningTimeResult.data;

    return Result.ok({
      vote: savedVoteResult.data,
      winningTime: winningTime
        ? {
            id: winningTime.id,
            startTime: winningTime.startTime,
            endTime: winningTime.endTime,
          }
        : null,
    });
  }
}
