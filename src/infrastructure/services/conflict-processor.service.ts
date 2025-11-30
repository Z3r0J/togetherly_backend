import {
  OutboxEvent,
  createOutboxEvent,
} from "@domain/entities/notifications/outbox-event.entity.js";
import {
  IEventRepository,
  IEventRsvpRepository,
} from "@domain/ports/event.repository.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import {
  INotificationRepository,
  IOutboxRepository,
} from "@domain/ports/notification.repository.js";
import { NotificationTemplateService } from "@app/services/notification-template.service.js";
import { ILogger } from "@domain/ports/logger.port.js";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";

/**
 * ConflictProcessorService
 * Runs conflict detection for a single event and applies auto-RSVP + notifications
 * This runs in the background via the outbox processor to keep API responses fast.
 */
export class ConflictProcessorService {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventRsvpRepository: IEventRsvpRepository,
    private readonly personalEventRepository: IPersonalEventRepository,
    private readonly circleRepository: ICircleRepository,
    private readonly circleMemberRepository: ICircleMemberRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly outboxRepository: IOutboxRepository,
    private readonly notificationTemplateService: NotificationTemplateService,
    private readonly logger: ILogger
  ) {}

  async processEvent(event: OutboxEvent): Promise<void> {
    const payload = event.payload as { eventId?: string; circleId?: string };
    if (!payload || !payload.eventId || !payload.circleId) {
      this.logger.error(
        "Invalid payload for event.process_conflicts",
        undefined,
        {
          eventId: event.id,
          payload: event.payload,
        }
      );
      return;
    }

    const eventId = payload.eventId;
    const circleId = payload.circleId;

    try {
      // Load event and circle
      const eventRes = await this.eventRepository.findById(eventId);
      const circleRes = await this.circleRepository.findById(circleId);
      if (!eventRes.ok || !eventRes.data || !circleRes.ok || !circleRes.data) {
        this.logger.warn(
          "Event or circle not found when processing conflicts",
          { eventId, circleId }
        );
        return;
      }

      const evt = eventRes.data;

      // Get members
      const membersRes = await this.circleMemberRepository.listCircleMembers(
        circleId
      );
      if (!membersRes.ok || !membersRes.data) return;
      const members = membersRes.data;

      for (const member of members) {
        let conflictingEvent: any = null;

        // Personal event overlap
        try {
          const personalConflictResult =
            await this.personalEventRepository.checkOverlap(
              member.userId,
              evt.startsAt!,
              evt.endsAt!
            );
          if (
            personalConflictResult.ok &&
            personalConflictResult.data &&
            personalConflictResult.data.length > 0
          ) {
            conflictingEvent = personalConflictResult.data[0];
          }
        } catch (err) {
          // log and continue
          this.logger.debug("Error checking personal overlap", {
            err,
            userId: member.userId,
          });
        }

        // Check other circle events the user RSVP'd 'going'
        if (!conflictingEvent) {
          try {
            const memberCirclesRes = await this.circleRepository.listMyCircles(
              member.userId
            );
            if (memberCirclesRes.ok && memberCirclesRes.data) {
              for (const c of memberCirclesRes.data) {
                const eventsRes = await this.eventRepository.findByCircleId(
                  c.id!
                );
                if (!eventsRes.ok || !eventsRes.data) continue;

                for (const otherEvt of eventsRes.data) {
                  if (otherEvt.id === eventId) continue;
                  if (!otherEvt.startsAt || !otherEvt.endsAt) continue;

                  const overlap =
                    new Date(otherEvt.startsAt).getTime() <
                      evt.endsAt!.getTime() &&
                    new Date(otherEvt.endsAt).getTime() >
                      evt.startsAt!.getTime();

                  if (!overlap) continue;

                  const rsvpRes =
                    await this.eventRsvpRepository.findByEventAndUser(
                      otherEvt.id!,
                      member.userId
                    );
                  if (
                    rsvpRes.ok &&
                    rsvpRes.data &&
                    rsvpRes.data.status === "going"
                  ) {
                    conflictingEvent = otherEvt;
                    break;
                  }
                }

                if (conflictingEvent) break;
              }
            }
          } catch (err) {
            this.logger.debug("Error checking circle events for user", {
              err,
              userId: member.userId,
            });
          }
        }

        if (conflictingEvent) {
          const existingRsvpRes =
            await this.eventRsvpRepository.findByEventAndUser(
              eventId,
              member.userId
            );
          if (!existingRsvpRes.ok) continue;
          if (!existingRsvpRes.data) {
            const rsvp: EventRsvp = {
              eventId,
              userId: member.userId,
              status: "not going",
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await this.eventRsvpRepository.upsert(rsvp);

            try {
              const notification =
                this.notificationTemplateService.createConflictDetection(
                  member.userId,
                  { id: evt.id!, title: evt.title },
                  { id: conflictingEvent.id!, title: conflictingEvent.title }
                );

              const notificationResult =
                await this.notificationRepository.create(notification);
              if (notificationResult.ok) {
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
            } catch (err) {
              this.logger.error(
                "Failed to create conflict notification",
                err as Error
              );
            }
          }
        }
      }
    } catch (err) {
      this.logger.error(
        "Error processing event.process_conflicts",
        err as Error
      );
    }
  }
}
