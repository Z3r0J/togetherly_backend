import {
  IEventRepository,
  IEventTimeRepository,
  IEventRsvpRepository,
} from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
import { Result } from "@shared/types/Result.js";
import { Event } from "@domain/entities/events/event.entity.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Finalize Event Use Case
 * Automatically finalizes event by selecting the time with most votes
 */
export class FinalizeEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventTimeRepository: IEventTimeRepository,
    private readonly circleMemberRepository: ICircleMemberRepository,
    private readonly eventRsvpRepository: IEventRsvpRepository,
    private readonly personalEventRepository: IPersonalEventRepository
  ) {}

  async execute(userId: string, eventId: string): Promise<Result<Event>> {
    // Find event
    const eventResult = await this.eventRepository.findById(eventId);

    if (!eventResult.ok) {
      return eventResult;
    }

    const event = eventResult.data;

    if (!event) {
      return Result.fail("Event not found", 404, ErrorCode.EVENT_NOT_FOUND);
    }

    // Check event status
    if (event.status === "finalized") {
      return Result.fail(
        "Event is already finalized",
        400,
        ErrorCode.EVENT_ALREADY_FINALIZED
      );
    }

    // Check permissions (creator or admin)
    const isCreator = event.userId === userId;
    const membershipResult = await this.circleMemberRepository.findMember(
      event.circleId,
      userId
    );

    if (!membershipResult.ok || !membershipResult.data) {
      return Result.fail(
        "You are not a member of this circle",
        403,
        ErrorCode.NOT_CIRCLE_MEMBER
      );
    }

    const membership = membershipResult.data;

    const canFinalize =
      isCreator || membership.role === "owner" || membership.role === "admin";

    if (!canFinalize) {
      return Result.fail(
        "You don't have permission to finalize this event",
        403,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // Get winning time (most votes)
    const winningTimeResult = await this.eventTimeRepository.findWinningTime(
      eventId
    );

    if (!winningTimeResult.ok) {
      return Result.fail(
        winningTimeResult.error,
        500,
        winningTimeResult.errorCode || ErrorCode.DATABASE_ERROR,
        winningTimeResult.details
      );
    }

    const winningTime = winningTimeResult.data;

    if (!winningTime) {
      return Result.fail(
        "No time options available to finalize",
        400,
        ErrorCode.EVENT_TIME_REQUIRED
      );
    }

    // Update event with winning time and finalize status
    event.startsAt = winningTime.startTime;
    event.endsAt = winningTime.endTime;
    event.status = "finalized";
    event.updatedAt = new Date();

    const updatedEventResult = await this.eventRepository.update(event);

    if (!updatedEventResult.ok) {
      return updatedEventResult;
    }

    // Check for conflicts and auto-RSVP members with conflicts
    await this.handleConflictBasedRsvp(
      eventId,
      event.circleId,
      event.startsAt!,
      event.endsAt!
    );

    return Result.ok(updatedEventResult.data);
  }

  /**
   * Check all circle members for personal calendar conflicts
   * and auto-RSVP them as "not going" if conflicts exist
   */
  private async handleConflictBasedRsvp(
    eventId: string,
    circleId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Get all circle members
    const membersResult = await this.circleMemberRepository.listCircleMembers(
      circleId
    );

    if (!membersResult.ok || !membersResult.data) {
      return; // Silently fail, don't block event finalization
    }

    const members = membersResult.data;

    // Check each member for conflicts
    for (const member of members) {
      const conflictResult = await this.personalEventRepository.checkOverlap(
        member.userId,
        startTime,
        endTime
      );

      if (
        conflictResult.ok &&
        conflictResult.data &&
        conflictResult.data.length > 0
      ) {
        // Member has conflicts, auto-RSVP as "not going"
        const rsvp: EventRsvp = {
          eventId,
          userId: member.userId,
          status: "not going",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.eventRsvpRepository.upsert(rsvp);
      }
    }
  }
}
