import { randomUUID } from "crypto";
import { Event } from "@domain/entities/events/event.entity.js";
import { EventTime } from "@domain/entities/events/event-time.entity.js";
import {
  IEventRepository,
  IEventTimeRepository,
  IEventRsvpRepository,
} from "@domain/ports/event.repository.js";
import {
  ICircleMemberRepository,
  ICircleRepository,
} from "@domain/ports/circle.repository.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { IUserRepository } from "@domain/ports/account.repository.js";
import {
  INotificationRepository,
  IOutboxRepository,
} from "@domain/ports/notification.repository.js";
import { NotificationTemplateService } from "@app/services/notification-template.service.js";
import { createOutboxEvent } from "@domain/entities/notifications/outbox-event.entity.js";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
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
    private readonly circleMemberRepository: ICircleMemberRepository,
    private readonly circleRepository: ICircleRepository,
    private readonly eventRsvpRepository: IEventRsvpRepository,
    private readonly personalEventRepository: IPersonalEventRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly outboxRepository: IOutboxRepository,
    private readonly notificationTemplateService: NotificationTemplateService
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

    // If time options provided, use earliest option as placeholder start/end for visibility
    let pollStart: Date | undefined;
    let pollEnd: Date | undefined;
    if (input.timeOptions && input.timeOptions.length > 0) {
      const sorted = [...input.timeOptions].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      pollStart = new Date(sorted[0].startTime);
      pollEnd = new Date(sorted[0].endTime);
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
      startsAt: input.startsAt ? new Date(input.startsAt) : pollStart,
      endsAt: input.endsAt ? new Date(input.endsAt) : pollEnd,
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
    } else if (savedEvent.startsAt && savedEvent.endsAt) {
      // Event has fixed time, check for conflicts and auto-RSVP
      await this.handleConflictBasedRsvp(
        savedEvent.id!,
        input.circleId,
        savedEvent.startsAt,
        savedEvent.endsAt
      );

      // Notify circle members about the new event
      await this.notifyCircleMembers(savedEvent);
    }

    return Result.ok(savedEvent);
  }

  /**
   * Notify circle members with event_invitation notification
   */
  private async notifyCircleMembers(event: Event): Promise<void> {
    try {
      // Get all circle members
      const membersResult = await this.circleMemberRepository.listCircleMembers(
        event.circleId
      );

      if (!membersResult.ok || !membersResult.data) {
        return; // Silently fail
      }

      const members = membersResult.data;

      // Fetch circle and inviter details
      const circleResult = await this.circleRepository.findById(event.circleId);
      const inviterResult = await this.userRepository.findById(event.userId);

      if (
        !circleResult.ok ||
        !circleResult.data ||
        !inviterResult.ok ||
        !inviterResult.data
      ) {
        return; // Silently fail
      }

      const circle = circleResult.data;
      const inviterName = inviterResult.data.name || "Someone";

      // Create notifications for all members (including the creator)
      const notifications = members.map((member) =>
        this.notificationTemplateService.createEventInvitation(
          member.userId,
          { name: inviterName },
          event,
          circle
        )
      );

      if (notifications.length === 0) {
        return; // No one to notify
      }

      // Batch create notifications
      const notificationResult = await this.notificationRepository.createBatch(
        notifications
      );

      if (!notificationResult.ok) {
        return; // Silently fail
      }

      const savedNotifications = notificationResult.data;

      // Create outbox events for immediate push notifications
      for (const notification of savedNotifications) {
        const pushEvent = createOutboxEvent({
          aggregateType: "event",
          aggregateId: event.id!,
          eventType: "notification.push",
          maxRetries: 3,
          payload: {
            notificationId: notification.id!,
            userId: notification.userId,
          },
        });

        await this.outboxRepository.create(pushEvent);
      }
    } catch (error) {
      // Silently fail to not block event creation
      console.error("Error notifying circle members:", error);
    }
  }

  /**
   * Check all circle members for personal calendar conflicts
   * and auto-RSVP them as "not going" if conflicts exist
   */
  private async handleConflictBasedRsvp(
    eventId: string,
    circleId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Get all circle members
    const membersResult = await this.circleMemberRepository.listCircleMembers(
      circleId
    );

    if (!membersResult.ok || !membersResult.data) {
      return; // Silently fail, don't block event creation
    }

    const members = membersResult.data;

    // Get event and circle for notifications
    const eventResult = await this.eventRepository.findById(eventId);
    const circleResult = await this.circleRepository.findById(circleId);

    if (
      !eventResult.ok ||
      !eventResult.data ||
      !circleResult.ok ||
      !circleResult.data
    ) {
      return; // Silently fail
    }

    const event = eventResult.data;

    // Check each member for conflicts
    for (const member of members) {
      const conflictResult = await this.personalEventRepository.checkOverlap(
        member.userId,
        startTime,
        endTime
      );

      if (
        conflictResult.ok &&
        conflictResult.data &&
        conflictResult.data.length > 0
      ) {
        // Member has conflicts, auto-RSVP as "not going"
        const rsvp: EventRsvp = {
          eventId,
          userId: member.userId,
          status: "not going",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.eventRsvpRepository.upsert(rsvp);

        // Send conflict detection notification
        try {
          const conflictingEvent = conflictResult.data[0];
          const notification =
            this.notificationTemplateService.createConflictDetection(
              member.userId,
              { id: event.id!, title: event.title },
              { id: conflictingEvent.id!, title: conflictingEvent.title }
            );

          const notificationResult = await this.notificationRepository.create(
            notification
          );

          if (notificationResult.ok) {
            // Create outbox event for immediate push
            const pushEvent = createOutboxEvent({
              aggregateType: "event",
              aggregateId: eventId,
              eventType: "notification.push",
              maxRetries: 3,
              payload: {
                notificationId: notificationResult.data.id!,
                userId: member.userId,
              },
            });

            await this.outboxRepository.create(pushEvent);
          }
        } catch (error) {
          // Silently fail notification, don't block RSVP
          console.error("Error sending conflict notification:", error);
        }
      }
    }
  }
}
