import {
  IEventRepository,
  IEventTimeRepository,
} from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/Result.js";
import { Event } from "@domain/entities/events/event.entity.js";

/**
 * Finalize Event Use Case
 * Automatically finalizes event by selecting the time with most votes
 */
export class FinalizeEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventTimeRepository: IEventTimeRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(userId: string, eventId: string): Promise<Result<Event>> {
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
      return Result.fail("Event is already finalized");
    }

    // Check permissions (creator or admin)
    const isCreator = event.userId === userId;
    const membershipResult = await this.circleMemberRepository.findMember(
      event.circleId,
      userId
    );

    if (!membershipResult.ok || !membershipResult.data) {
      return Result.fail("You are not a member of this circle");
    }

    const membership = membershipResult.data;

    const canFinalize =
      isCreator || membership.role === "owner" || membership.role === "admin";

    if (!canFinalize) {
      return Result.fail("You don't have permission to finalize this event");
    }

    // Get winning time (most votes)
    const winningTimeResult = await this.eventTimeRepository.findWinningTime(
      eventId
    );

    if (!winningTimeResult.ok) {
      return Result.fail(winningTimeResult.error);
    }

    const winningTime = winningTimeResult.data;

    if (!winningTime) {
      return Result.fail("No time options available to finalize");
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

    return Result.ok(updatedEventResult.data);
  }
}
