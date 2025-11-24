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
import {
  INotificationRepository,
  IOutboxRepository,
} from "@domain/ports/notification.repository.js";
import { NotificationTemplateService } from "@app/services/notification-template.service.js";
import { createOutboxEvent } from "@domain/entities/notifications/outbox-event.entity.js";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";
import { Result } from "@shared/types/Result.js";
import { Event } from "@domain/entities/events/event.entity.js";
import { ErrorCode } from "@shared/errors/index.js";

/**
 * Finalize Event Use Case
 * Automatically finalizes event by selecting the time with most votes
 */
export class FinalizeEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventTimeRepository: IEventTimeRepository,
    private readonly circleMemberRepository: ICircleMemberRepository,
    private readonly circleRepository: ICircleRepository,
    private readonly eventRsvpRepository: IEventRsvpRepository,
    private readonly personalEventRepository: IPersonalEventRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly outboxRepository: IOutboxRepository,
    private readonly notificationTemplateService: NotificationTemplateService
  ) {}

  async execute(userId: string, eventId: string): Promise<Result<Event>> {
    // Find event
    const eventResult = await this.eventRepository.findById(eventId);

    if (!eventResult.ok) {
      return eventResult;
    }

    const event = eventResult.data;

    if (!event) {
      return Result.fail("Event not found", 404, ErrorCode.EVENT_NOT_FOUND);
    }

    // Check event status
    if (event.status === "finalized") {
      return Result.fail(
        "Event is already finalized",
        400,
        ErrorCode.EVENT_ALREADY_FINALIZED
      );
    }

    // Check permissions (creator or admin)
    const isCreator = event.userId === userId;
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

    const canFinalize =
      isCreator || membership.role === "owner" || membership.role === "admin";

    if (!canFinalize) {
      return Result.fail(
        "You don't have permission to finalize this event",
        403,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // Get winning time (most votes)
    const winningTimeResult = await this.eventTimeRepository.findWinningTime(
      eventId
    );

    if (!winningTimeResult.ok) {
      return Result.fail(
        winningTimeResult.error,
        500,
        winningTimeResult.errorCode || ErrorCode.DATABASE_ERROR,
        winningTimeResult.details
      );
    }

    const winningTime = winningTimeResult.data;

    if (!winningTime) {
      return Result.fail(
        "No time options available to finalize",
        400,
        ErrorCode.EVENT_TIME_REQUIRED
      );
    }

    // Update event with winning time and finalize status
    event.startsAt = winningTime.startTime;
    event.endsAt = winningTime.endTime;
    event.status = "finalized";
    event.updatedAt = new Date();

    const updatedEventResult = await this.eventRepository.update(event);

    if (!updatedEventResult.ok) {
      return updatedEventResult;
    }

    // Check for conflicts and auto-RSVP members with conflicts
    await this.handleConflictBasedRsvp(
      eventId,
      event.circleId,
      event.startsAt!,
      event.endsAt!
    );

    // Notify circle members and schedule reminders
    await this.notifyCircleMembers(updatedEventResult.data);

    return Result.ok(updatedEventResult.data);
  }

  /**
   * Notify circle members with event_finalized notification
   * and schedule reminders based on event.reminderMinutes
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

      // Fetch circle details for notification
      const circleResult = await this.circleRepository.findById(event.circleId);
      if (!circleResult.ok || !circleResult.data) {
        return; // Silently fail
      }
      const circle = circleResult.data;

      // Create notifications for all members
      const notifications = members.map((member) =>
        this.notificationTemplateService.createEventFinalized(
          member.userId,
          event,
          circle
        )
      );

      // Batch create notifications
      const notificationResult = await this.notificationRepository.createBatch(
        notifications
      );

      if (!notificationResult.ok) {
        return; // Silently fail
      }

      const savedNotifications = notificationResult.data;

      // Create outbox events for immediate push notifications
      const pushEvents = savedNotifications.map((notification) =>
        createOutboxEvent({
          aggregateType: "event",
          aggregateId: event.id!,
          eventType: "notification.push",
          maxRetries: 3,
          payload: {
            notificationId: notification.id!,
            userId: notification.userId,
          },
        })
      );

      // Save all push events
      for (const pushEvent of pushEvents) {
        await this.outboxRepository.create(pushEvent);
      }

      // Schedule reminders if reminderMinutes is set
      if (
        event.reminderMinutes &&
        event.reminderMinutes > 0 &&
        event.startsAt
      ) {
        const reminderTime = new Date(
          event.startsAt.getTime() - event.reminderMinutes * 60 * 1000
        );

        // Only schedule if reminder time is in the future
        if (reminderTime > new Date()) {
          const reminderEvents = savedNotifications.map((notification) =>
            createOutboxEvent({
              aggregateType: "event",
              aggregateId: event.id!,
              eventType: "notification.reminder",
              maxRetries: 3,
              payload: {
                notificationId: notification.id!,
                userId: notification.userId,
                eventId: event.id!,
              },
              scheduledFor: reminderTime,
            })
          );

          for (const reminderEvent of reminderEvents) {
            await this.outboxRepository.create(reminderEvent);
          }
        }
      }
    } catch (error) {
      // Silently fail to not block event finalization
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
      return; // Silently fail, don't block event finalization
    }

    const members = membersResult.data;

    // Get event for notifications
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
