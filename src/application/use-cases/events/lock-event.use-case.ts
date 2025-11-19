import {
  IEventRepository,
  IEventTimeRepository,
} from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { LockEventInput } from "@app/schemas/events/event.schema.js";
import { Result } from "@shared/types/Result.js";
import { Event } from "@domain/entities/events/event.entity.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Lock Event Use Case
 * Locks voting and sets the final event time based on selected time option
 */
export class LockEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventTimeRepository: IEventTimeRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(
    userId: string,
    eventId: string,
    input: LockEventInput
  ): Promise<Result<Event>> {
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

    const canLock =
      isCreator || membership.role === "owner" || membership.role === "admin";

    if (!canLock) {
      return Result.fail(
        "You don't have permission to lock this event",
        403,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // Verify selected time belongs to this event
    const selectedTimeResult = await this.eventTimeRepository.findById(
      input.selectedTimeId
    );

    if (!selectedTimeResult.ok) {
      return selectedTimeResult;
    }

    const selectedTime = selectedTimeResult.data;

    if (!selectedTime || selectedTime.eventId !== eventId) {
      return Result.fail(
        "Invalid time option for this event",
        400,
        ErrorCode.EVENT_TIME_NOT_FOUND
      );
    }

    // Update event with selected time and lock status
    event.startsAt = selectedTime.startTime;
    event.endsAt = selectedTime.endTime;
    event.status = "locked";
    event.updatedAt = new Date();

    const updatedEventResult = await this.eventRepository.update(event);

    if (!updatedEventResult.ok) {
      return updatedEventResult;
    }

    return Result.ok(updatedEventResult.data);
  }
}
