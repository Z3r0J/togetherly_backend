import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";

/**
 * Delete Personal Event Use Case
 */

export interface DeletePersonalEventInput {
  eventId: string;
  userId: string;
}

export interface DeletePersonalEventDeps {
  personalEventRepo: IPersonalEventRepository;
}

export class DeletePersonalEventUseCase {
  constructor(private deps: DeletePersonalEventDeps) {}

  async execute(input: DeletePersonalEventInput): Promise<Result<void>> {
    const { eventId, userId } = input;

    // 1. Check if event exists and belongs to user
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

    if (event.userId !== userId) {
      return Result.fail(
        "You don't have permission to delete this event",
        403,
        ErrorCode.UNAUTHORIZED
      );
    }

    // 2. Soft delete the event
    const deleteResult = await this.deps.personalEventRepo.softDelete(eventId);

    if (!deleteResult.ok) {
      return Result.fail(
        deleteResult.error!,
        deleteResult.status!,
        deleteResult.errorCode!
      );
    }

    return Result.ok(undefined);
  }
}
