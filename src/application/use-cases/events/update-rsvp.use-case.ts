import { randomUUID } from "crypto";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
import {
  IEventRsvpRepository,
  IEventRepository,
} from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { UpdateRsvpInput } from "@app/schemas/events/event.schema.js";
import { Result } from "@shared/types/Result.js";

/**
 * Update RSVP Use Case
 * Creates or updates user's RSVP status for an event
 */
export class UpdateRsvpUseCase {
  constructor(
    private readonly rsvpRepository: IEventRsvpRepository,
    private readonly eventRepository: IEventRepository,
    private readonly circleMemberRepository: ICircleMemberRepository
  ) {}

  async execute(
    userId: string,
    eventId: string,
    input: UpdateRsvpInput
  ): Promise<Result<EventRsvp>> {
    // Find event
    const eventResult = await this.eventRepository.findById(eventId);

    if (!eventResult.ok) {
      return eventResult;
    }

    const event = eventResult.data;

    if (!event) {
      return Result.fail("Event not found");
    }

    // Verify user is member of the circle
    const membershipResult = await this.circleMemberRepository.findMember(
      event.circleId,
      userId
    );

    if (!membershipResult.ok || !membershipResult.data) {
      return Result.fail("You are not a member of this circle");
    }

    // Create or update RSVP
    const rsvp: EventRsvp = {
      id: randomUUID(),
      eventId,
      userId,
      status: input.status,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const savedRsvpResult = await this.rsvpRepository.upsert(rsvp);

    if (!savedRsvpResult.ok) {
      return savedRsvpResult;
    }

    return Result.ok(savedRsvpResult.data);
  }
}
