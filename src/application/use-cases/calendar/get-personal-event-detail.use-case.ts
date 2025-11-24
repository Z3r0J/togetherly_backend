import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";

/**
 * Get Personal Event Detail Use Case
 */

export interface GetPersonalEventDetailInput {
  eventId: string;
  userId: string;
}

export interface GetPersonalEventDetailDeps {
  personalEventRepo: IPersonalEventRepository;
}

export class GetPersonalEventDetailUseCase {
  constructor(private deps: GetPersonalEventDetailDeps) {}

  async execute(
    input: GetPersonalEventDetailInput
  ): Promise<Result<PersonalEvent>> {
    const { eventId, userId } = input;

    // 1. Find the event
    const eventResult = await this.deps.personalEventRepo.findById(eventId);

    if (!eventResult.ok) {
      return Result.fail(
        eventResult.error!,
        eventResult.status!,
        eventResult.errorCode!
      );
    }

    const event = eventResult.data;
    if (!event) {
      return Result.fail(
        "Personal event not found",
        404,
        ErrorCode.PERSONAL_EVENT_NOT_FOUND
      );
    }

    // 2. Verify ownership
    if (event.userId !== userId) {
      return Result.fail(
        "You don't have permission to view this event",
        403,
        ErrorCode.UNAUTHORIZED
      );
    }

    return Result.ok(event);
  }
}
