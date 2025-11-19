import { IEventRepository } from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { UpdateEventInput } from "@app/schemas/events/event.schema.js";
import { Result } from "@shared/types/Result.js";
import { Event } from "@domain/entities/events/event.entity.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Update Event Use Case
 * Updates event details (only for creator or circle admins)
 */
export class UpdateEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(
    userId: string,
    eventId: string,
    input: UpdateEventInput
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

    // Check if user can edit
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

    const canEdit =
      isCreator || membership.role === "owner" || membership.role === "admin";

    if (!canEdit) {
      return Result.fail(
        "You don't have permission to edit this event",
        403,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // Cannot edit finalized event times
    if (event.status === "finalized" && (input.startsAt || input.endsAt)) {
      return Result.fail(
        "Cannot change times of finalized event",
        400,
        ErrorCode.EVENT_ALREADY_FINALIZED
      );
    }

    // Update event
    if (input.title !== undefined) event.title = input.title;
    if (input.description !== undefined) event.description = input.description;
    if (input.notes !== undefined) event.notes = input.notes;
    if (input.location !== undefined) event.location = input.location;
    if (input.startsAt !== undefined) event.startsAt = new Date(input.startsAt);
    if (input.endsAt !== undefined) event.endsAt = new Date(input.endsAt);
    if (input.allDay !== undefined) event.allDay = input.allDay;
    if (input.color !== undefined) event.color = input.color;
    if (input.reminderMinutes !== undefined)
      event.reminderMinutes = input.reminderMinutes;

    event.updatedAt = new Date();

    const updatedEventResult = await this.eventRepository.update(event);

    if (!updatedEventResult.ok) {
      return updatedEventResult;
    }

    return Result.ok(updatedEventResult.data);
  }
}
