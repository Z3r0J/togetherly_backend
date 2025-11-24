import { Result } from "@shared/types/index.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";

/**
 * List Personal Events Use Case
 * Returns all personal events for a user, optionally filtered by date range
 */

export interface ListPersonalEventsInput {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ListPersonalEventsDeps {
  personalEventRepo: IPersonalEventRepository;
}

export class ListPersonalEventsUseCase {
  constructor(private deps: ListPersonalEventsDeps) {}

  async execute(
    input: ListPersonalEventsInput
  ): Promise<Result<PersonalEvent[]>> {
    const { userId, startDate, endDate } = input;

    // If date range provided, use filtered query
    if (startDate && endDate) {
      const result = await this.deps.personalEventRepo.findByUserIdAndDateRange(
        userId,
        startDate,
        endDate
      );

      if (!result.ok) {
        return Result.fail(result.error!, result.status!, result.errorCode!);
      }

      return Result.ok(result.data!);
    }

    // Otherwise, return all events for user
    const result = await this.deps.personalEventRepo.findByUserId(userId);

    if (!result.ok) {
      return Result.fail(result.error!, result.status!, result.errorCode!);
    }

    return Result.ok(result.data!);
  }
}
