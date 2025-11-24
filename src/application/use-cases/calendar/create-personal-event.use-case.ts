import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import {
  PersonalEvent,
  createPersonalEvent,
} from "@domain/entities/calendar/personal-event.entity.js";

/**
 * Create Personal Event Use Case
 */

export interface CreatePersonalEventInput {
  userId: string;
  title: string;
  date: Date;
  startTime: Date;
  endTime: Date;
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

export interface CreatePersonalEventDeps {
  personalEventRepo: IPersonalEventRepository;
}

export class CreatePersonalEventUseCase {
  constructor(private deps: CreatePersonalEventDeps) {}

  async execute(
    input: CreatePersonalEventInput
  ): Promise<Result<PersonalEvent>> {
    // 1. Validate time range
    if (input.startTime >= input.endTime) {
      return Result.fail(
        "Start time must be before end time",
        400,
        ErrorCode.PERSONAL_EVENT_INVALID_TIME
      );
    }

    // 2. Check for overlapping events
    const overlapResult = await this.deps.personalEventRepo.checkOverlap(
      input.userId,
      input.startTime,
      input.endTime
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
        "This time slot conflicts with an existing personal event",
        409,
        ErrorCode.PERSONAL_EVENT_TIME_CONFLICT,
        { conflictingEvents: overlapResult.data }
      );
    }

    // 3. Create the event
    const newEvent = createPersonalEvent({
      userId: input.userId,
      title: input.title,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      allDay: input.allDay,
      location: input.location,
      notes: input.notes,
      color: input.color,
      reminderMinutes: input.reminderMinutes,
    });

    const createResult = await this.deps.personalEventRepo.create(newEvent);

    if (!createResult.ok) {
      return Result.fail(
        createResult.error!,
        createResult.status!,
        createResult.errorCode!
      );
    }

    return Result.ok(createResult.data!);
  }
}
