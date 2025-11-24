/**
 * Notification Entity
 * @author Jean Carlos Reyes
 * @description Represents a notification in the system
 * @version 1.0.0
 */

export type NotificationCategory = "event" | "circle" | "rsvp";

export type NotificationType =
  | "event_reminder"
  | "conflict_detected"
  | "rsvp_updated"
  | "event_invitation"
  | "circle_invitation"
  | "event_finalized"
  | "member_joined";

export type NotificationPriority = "normal" | "high";

export type NotificationIconType = "calendar" | "warning" | "person" | "group";

export interface NotificationAction {
  label: string;
  action: string; // e.g., "view_event", "dismiss", "resolve", "accept", "decline"
  style: "primary" | "secondary" | "success" | "danger"; // Button styling
}

export interface NotificationMetadata {
  eventId?: string;
  circleId?: string;
  inviterId?: string;
  conflictingEvents?: Array<{ id: string; title: string }>;
  rsvpStatus?: "going" | "not going" | "maybe";
  [key: string]: any;
}

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  priority: NotificationPriority;
  iconType: NotificationIconType;
  iconColor: string; // Hex color code
  actionButtons: NotificationAction[]; // Serialized as JSON
  metadata: NotificationMetadata; // Serialized as JSON
  isRead: boolean;
  readAt?: Date | null;
  dismissedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createNotification = (
  props: Omit<Notification, "id" | "createdAt" | "updatedAt">
): Notification => {
  return {
    userId: props.userId,
    type: props.type,
    category: props.category,
    title: props.title,
    body: props.body,
    priority: props.priority,
    iconType: props.iconType,
    iconColor: props.iconColor,
    actionButtons: props.actionButtons,
    metadata: props.metadata,
    isRead: props.isRead,
    readAt: props.readAt,
    dismissedAt: props.dismissedAt,
  };
};
