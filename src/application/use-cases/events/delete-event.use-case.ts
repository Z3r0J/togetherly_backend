import { IEventRepository } from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Delete Event Use Case
 * Soft deletes an event (only for creator or circle owner)
 */
export class DeleteEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(userId: string, eventId: string): Promise<Result<void>> {
    // Find event
    const eventResult = await this.eventRepository.findById(eventId);

    if (!eventResult.ok) {
      return eventResult;
    }

    const event = eventResult.data;

    if (!event) {
      return Result.fail("Event not found", 404, ErrorCode.EVENT_NOT_FOUND);
    }

    // Check if user can delete
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

    const canDelete = isCreator || membership.role === "owner";

    if (!canDelete) {
      return Result.fail(
        "You don't have permission to delete this event",
        403,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // Soft delete event
    const deleteResult = await this.eventRepository.delete(eventId);

    if (!deleteResult.ok) {
      return deleteResult;
    }

    return Result.ok(undefined);
  }
}
