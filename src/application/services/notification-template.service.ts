import { randomUUID } from "crypto";
import {
  Notification,
  NotificationAction,
  NotificationMetadata,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationIconType,
} from "@domain/entities/index.js";
import { Event } from "@domain/entities/events/event.entity.js";
import { Circle } from "@domain/entities/circles/circle.entity.js";
import { User } from "@domain/entities/account/user.entity.js";

/**
 * Notification Template Service
 * Creates notifications based on predefined templates for each notification type
 */
export class NotificationTemplateService {
  /**
   * Create event reminder notification
   * Blue calendar icon with "View Event" and "Dismiss" buttons
   */
  createEventReminder(
    userId: string,
    event: Event,
    timeUntil: string
  ): Notification {
    const actionButtons: NotificationAction[] = [
      { label: "View Event", action: "view_event", style: "primary" },
      { label: "Dismiss", action: "dismiss", style: "secondary" },
    ];

    const metadata: NotificationMetadata = {
      eventId: event.id!,
      circleId: event.circleId,
    };

    return {
      id: randomUUID(),
      userId,
      type: "event_reminder" as NotificationType,
      category: "event" as NotificationCategory,
      title: `Reminder: ${event.title} is ${timeUntil}`,
      body: `at ${event.location?.name || "TBD"}.`,
      priority: "normal" as NotificationPriority,
      iconType: "calendar" as NotificationIconType,
      iconColor: "#4A90E2", // Blue
      actionButtons,
      metadata,
      isRead: false,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create conflict detection notification
   * Orange warning icon with "Resolve" and "View" buttons
   */
  createConflictDetection(
    userId: string,
    event1: { id: string; title: string },
    event2: { id: string; title: string }
  ): Notification {
    const actionButtons: NotificationAction[] = [
      { label: "Resolve", action: "resolve", style: "primary" },
      { label: "View", action: "view", style: "secondary" },
    ];

    const metadata: NotificationMetadata = {
      conflictingEvents: [event1, event2],
    };

    return {
      id: randomUUID(),
      userId,
      type: "conflict_detected" as NotificationType,
      category: "event" as NotificationCategory,
      title: `Conflict Detected: '${event1.title}' clashes with '${event2.title}'.`,
      body: "You have overlapping events in your calendar.",
      priority: "high" as NotificationPriority,
      iconType: "warning" as NotificationIconType,
      iconColor: "#F5A623", // Orange
      actionButtons,
      metadata,
      isRead: false,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create RSVP updated notification
   * Green person icon with user's name and status
   */
  createRsvpUpdate(
    userId: string,
    user: { name: string },
    event: Event,
    newStatus: "going" | "not going" | "maybe"
  ): Notification {
    const actionButtons: NotificationAction[] = [];

    const metadata: NotificationMetadata = {
      eventId: event.id!,
      circleId: event.circleId,
      rsvpStatus: newStatus,
    };

    const statusText =
      newStatus === "going"
        ? "Going"
        : newStatus === "not going"
        ? "Not Going"
        : "Maybe";
    const statusColor =
      newStatus === "going"
        ? "#7ED321"
        : newStatus === "not going"
        ? "#D0021B"
        : "#F5A623";

    return {
      id: randomUUID(),
      userId,
      type: "rsvp_updated" as NotificationType,
      category: "rsvp" as NotificationCategory,
      title: `${user.name} has updated their RSVP for '${event.title}' to`,
      body: `${statusText}.`,
      priority: "normal" as NotificationPriority,
      iconType: "person" as NotificationIconType,
      iconColor: statusColor,
      actionButtons,
      metadata,
      isRead: false,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create event invitation notification
   * Blue calendar icon with "Set RSVP" and "View" buttons
   */
  createEventInvitation(
    userId: string,
    inviter: { name: string },
    event: Event,
    circle: Circle
  ): Notification {
    const actionButtons: NotificationAction[] = [
      { label: "Set RSVP", action: "set_rsvp", style: "primary" },
      { label: "View", action: "view_event", style: "secondary" },
    ];

    const eventDate = event.startsAt
      ? new Date(event.startsAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "TBD";

    const metadata: NotificationMetadata = {
      eventId: event.id!,
      circleId: event.circleId,
      inviterId: inviter.name,
    };

    return {
      id: randomUUID(),
      userId,
      type: "event_invitation" as NotificationType,
      category: "event" as NotificationCategory,
      title: `${inviter.name} invited you to '${event.title}' in the '${circle.name}' circle on ${eventDate}.`,
      body: event.description || "",
      priority: "normal" as NotificationPriority,
      iconType: "calendar" as NotificationIconType,
      iconColor: "#4A90E2", // Blue
      actionButtons,
      metadata,
      isRead: false,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create circle invitation notification
   * Blue group icon with "Accept" and "Decline" buttons
   */
  createCircleInvitation(
    userId: string,
    inviter: { name: string },
    circle: Circle
  ): Notification {
    const actionButtons: NotificationAction[] = [
      { label: "Accept", action: "accept_invitation", style: "success" },
      { label: "Decline", action: "decline_invitation", style: "danger" },
    ];

    const metadata: NotificationMetadata = {
      circleId: circle.id!,
      inviterId: inviter.name,
      shareToken: circle.shareToken || undefined,
    };

    return {
      id: randomUUID(),
      userId,
      type: "circle_invitation" as NotificationType,
      category: "circle" as NotificationCategory,
      title: `${inviter.name} has invited you to join the '${circle.name}' circle.`,
      body: circle.description || "",
      priority: "normal" as NotificationPriority,
      iconType: "group" as NotificationIconType,
      iconColor: "#4A90E2", // Blue
      actionButtons,
      metadata,
      isRead: false,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create event finalized notification
   * Blue calendar icon - notifies members that event time has been chosen
   */
  createEventFinalized(
    userId: string,
    event: Event,
    circle: Circle
  ): Notification {
    const actionButtons: NotificationAction[] = [
      { label: "View Event", action: "view_event", style: "primary" },
    ];

    const eventDate = event.startsAt
      ? new Date(event.startsAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "TBD";

    const metadata: NotificationMetadata = {
      eventId: event.id!,
      circleId: event.circleId,
    };

    return {
      id: randomUUID(),
      userId,
      type: "event_finalized" as NotificationType,
      category: "event" as NotificationCategory,
      title: `Event Finalized: '${event.title}' in ${circle.name}`,
      body: `The event is scheduled for ${eventDate}.`,
      priority: "normal" as NotificationPriority,
      iconType: "calendar" as NotificationIconType,
      iconColor: "#4A90E2", // Blue
      actionButtons,
      metadata,
      isRead: false,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create member joined notification
   * Green person icon - notifies circle owner when someone joins
   */
  createMemberJoined(
    userId: string,
    newMember: User,
    circle: Circle
  ): Notification {
    const actionButtons: NotificationAction[] = [];

    const metadata: NotificationMetadata = {
      circleId: circle.id!,
    };

    return {
      id: randomUUID(),
      userId,
      type: "member_joined" as NotificationType,
      category: "circle" as NotificationCategory,
      title: `${newMember.name} joined '${circle.name}'`,
      body: `Your circle now has one more member!`,
      priority: "normal" as NotificationPriority,
      iconType: "person" as NotificationIconType,
      iconColor: "#7ED321", // Green
      actionButtons,
      metadata,
      isRead: false,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
