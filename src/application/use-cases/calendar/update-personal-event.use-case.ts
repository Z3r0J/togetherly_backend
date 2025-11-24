import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";

/**
 * Update Personal Event Use Case
 */

export interface UpdatePersonalEventInput {
  eventId: string;
  userId: string;
  title?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  notes?: string;
  color?: string;
  reminderMinutes?: number;
}

export interface UpdatePersonalEventDeps {
  personalEventRepo: IPersonalEventRepository;
}

export class UpdatePersonalEventUseCase {
  constructor(private deps: UpdatePersonalEventDeps) {}

  async execute(
    input: UpdatePersonalEventInput
  ): Promise<Result<PersonalEvent>> {
    const { eventId, userId, ...updates } = input;

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
        "You don't have permission to update this event",
        403,
        ErrorCode.UNAUTHORIZED
      );
    }

    // 2. Validate time range if times are being updated
    const newStartTime = updates.startTime || event.startTime;
    const newEndTime = updates.endTime || event.endTime;

    if (newStartTime >= newEndTime) {
      return Result.fail(
        "Start time must be before end time",
        400,
        ErrorCode.PERSONAL_EVENT_INVALID_TIME
      );
    }

    // 3. Check for overlapping events (exclude current event)
    if (updates.startTime || updates.endTime) {
      const overlapResult = await this.deps.personalEventRepo.checkOverlap(
        userId,
        newStartTime,
        newEndTime,
        eventId
      );

      if (!overlapResult.ok) {
        return Result.fail(
          overlapResult.error!,
          overlapResult.status!,
          overlapResult.errorCode!
        );
      }

      if (overlapResult.data && overlapResult.data.length > 0) {
        return Result.fail(
          "This time slot conflicts with another personal event",
          409,
          ErrorCode.PERSONAL_EVENT_TIME_CONFLICT,
          { conflictingEvents: overlapResult.data }
        );
      }
    }

    // 4. Update the event
    const updateResult = await this.deps.personalEventRepo.update(
      eventId,
      updates
    );

    if (!updateResult.ok) {
      return Result.fail(
        updateResult.error!,
        updateResult.status!,
        updateResult.errorCode!
      );
    }

    if (!updateResult.data) {
      return Result.fail(
        "Failed to update event",
        500,
        ErrorCode.PERSONAL_EVENT_UPDATE_FAILED
      );
    }

    return Result.ok(updateResult.data);
  }
}
