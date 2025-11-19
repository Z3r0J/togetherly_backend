import { randomUUID } from "crypto";
import { Event } from "@domain/entities/events/event.entity.js";
import { EventTime } from "@domain/entities/events/event-time.entity.js";
import {
  IEventRepository,
  IEventTimeRepository,
} from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { CreateEventInput } from "@app/schemas/events/event.schema.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Create Event Use Case
 * Creates a new event for a circle with optional time voting options
 */
export class CreateEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventTimeRepository: IEventTimeRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(
    userId: string,
    input: CreateEventInput
  ): Promise<Result<Event>> {
    // Verify user is member of the circle
    const membershipResult = await this.circleMemberRepository.findMember(
      input.circleId,
      userId
    );

    if (!membershipResult.ok || !membershipResult.data) {
      return Result.fail(
        "You are not a member of this circle",
        403,
        ErrorCode.NOT_CIRCLE_MEMBER
      );
    }

    // Validate time options if provided
    if (input.timeOptions && input.timeOptions.length > 0) {
      for (const option of input.timeOptions) {
        const startTime = new Date(option.startTime);
        const endTime = new Date(option.endTime);

        if (endTime <= startTime) {
          return Result.fail(
            "End time must be after start time",
            400,
            ErrorCode.EVENT_TIME_INVALID
          );
        }
      }
    }

    // Create event entity
    const event: Event = {
      id: randomUUID(),
      circleId: input.circleId,
      title: input.title,
      description: input.description,
      notes: input.notes,
      location: input.location,
      userId,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
      allDay: input.allDay,
      color: input.color,
      reminderMinutes: input.reminderMinutes,
      status:
        input.timeOptions && input.timeOptions.length > 0
          ? "draft"
          : "finalized",
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    // Save event
    const savedEventResult = await this.eventRepository.create(event);
    if (!savedEventResult.ok) {
      return savedEventResult;
    }

    const savedEvent = savedEventResult.data;

    // If time options provided, create them
    if (input.timeOptions && input.timeOptions.length > 0) {
      const eventTimes: EventTime[] = input.timeOptions.map((option) => ({
        id: randomUUID(),
        eventId: savedEvent.id!,
        startTime: new Date(option.startTime),
        endTime: new Date(option.endTime),
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }));

      const createTimesResult = await this.eventTimeRepository.createMany(
        eventTimes
      );
      if (!createTimesResult.ok) {
        return Result.fail(
          createTimesResult.error,
          500,
          createTimesResult.errorCode || ErrorCode.DATABASE_ERROR,
          createTimesResult.details
        );
      }
    }

    return Result.ok(savedEvent);
  }
}
