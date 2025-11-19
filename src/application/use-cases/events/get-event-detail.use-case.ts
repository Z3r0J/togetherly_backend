import { IEventRepository } from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Get Event Detail Use Case
 * Returns event details with time options, votes, and RSVPs
 */
export class GetEventDetailUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(userId: string, eventId: string): Promise<Result<any>> {
    // Find event with details
    const eventResult = await this.eventRepository.findByIdWithDetails(eventId);

    if (!eventResult.ok) {
      return eventResult;
    }

    const event = eventResult.data;

    if (!event) {
      return Result.fail("Event not found", 404, ErrorCode.EVENT_NOT_FOUND);
    }

    // Verify user is member of the circle
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

    // Check permissions
    const isCreator = event.userId === userId;
    const canEdit =
      isCreator || membership.role === "owner" || membership.role === "admin";
    const canDelete = isCreator || membership.role === "owner";

    return Result.ok({
      ...event,
      permissions: {
        canEdit,
        canDelete,
        canLock: canEdit,
      },
    });
  }
}
