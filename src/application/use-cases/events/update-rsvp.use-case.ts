import { randomUUID } from "crypto";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
import {
  IEventRsvpRepository,
  IEventRepository,
} from "@domain/ports/event.repository.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { IUserRepository } from "@domain/ports/account.repository.js";
import {
  INotificationRepository,
  IOutboxRepository,
} from "@domain/ports/notification.repository.js";
import { NotificationTemplateService } from "@app/services/notification-template.service.js";
import { createOutboxEvent } from "@domain/entities/notifications/outbox-event.entity.js";
import { UpdateRsvpInput } from "@app/schemas/events/event.schema.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Update RSVP Use Case
 * Creates or updates user's RSVP status for an event
 */
export class UpdateRsvpUseCase {
  constructor(
    private readonly rsvpRepository: IEventRsvpRepository,
    private readonly eventRepository: IEventRepository,
    private readonly circleMemberRepository: ICircleMemberRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly outboxRepository: IOutboxRepository,
    private readonly notificationTemplateService: NotificationTemplateService
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

    // Notify event creator if RSVP is from someone else
    if (userId !== event.userId) {
      await this.notifyEventCreator(userId, event, input.status);
    }

    return Result.ok(savedRsvpResult.data);
  }

  /**
   * Notify event creator when someone updates their RSVP
   */
  private async notifyEventCreator(
    rsvpUserId: string,
    event: any,
    status: "going" | "not going" | "maybe"
  ): Promise<void> {
    try {
      // Get RSVP user name
      const userResult = await this.userRepository.findById(rsvpUserId);
      if (!userResult.ok || !userResult.data) {
        return; // Silently fail
      }

      const userName = userResult.data.name || "Someone";

      // Create notification for event creator
      const notification = this.notificationTemplateService.createRsvpUpdate(
        event.userId,
        { name: userName },
        event,
        status
      );

      const notificationResult = await this.notificationRepository.create(
        notification
      );

      if (!notificationResult.ok) {
        return; // Silently fail
      }

      // Create outbox event for immediate push
      const pushEvent = createOutboxEvent({
        aggregateType: "event",
        aggregateId: event.id,
        eventType: "notification.push",
        maxRetries: 3,
        payload: {
          notificationId: notificationResult.data.id!,
          userId: event.userId,
        },
      });

      await this.outboxRepository.create(pushEvent);
    } catch (error) {
      // Silently fail to not block RSVP update
      console.error("Error notifying event creator:", error);
    }
  }
}
