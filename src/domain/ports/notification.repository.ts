import { Result } from "@shared/types/index.js";
import {
  Notification,
  NotificationCategory,
  DeviceToken,
  OutboxEvent,
} from "@domain/entities/index.js";

// Re-export for convenience
export { NotificationCategory };

/**
 * Notification Repository Port
 */
export interface INotificationRepository {
  create(notification: Notification): Promise<Result<Notification>>;
  findById(id: string): Promise<Result<Notification | null>>;
  findByUserId(
    userId: string,
    filters?: {
      category?: NotificationCategory;
      isRead?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Notification[]>>;
  markAsRead(notificationId: string): Promise<Result<void>>;
  markAllAsRead(
    userId: string,
    category?: NotificationCategory
  ): Promise<Result<void>>;
  dismiss(notificationId: string): Promise<Result<void>>;
  countUnread(
    userId: string,
    category?: NotificationCategory
  ): Promise<Result<number>>;
  deleteOld(daysOld: number): Promise<Result<number>>;
}

/**
 * Device Token Repository Port
 */
export interface IDeviceTokenRepository {
  upsert(deviceToken: DeviceToken): Promise<Result<DeviceToken>>;
  findByUserId(userId: string): Promise<Result<DeviceToken[]>>;
  findByToken(token: string): Promise<Result<DeviceToken | null>>;
  deactivate(tokenId: string): Promise<Result<void>>;
  deactivateByToken(token: string): Promise<Result<void>>;
  deleteExpired(daysOld: number): Promise<Result<number>>;
  updateLastUsed(tokenId: string): Promise<Result<void>>;
}

/**
 * Outbox Event Repository Port
 */
export interface IOutboxRepository {
  create(event: OutboxEvent): Promise<Result<OutboxEvent>>;
  findPending(limit?: number): Promise<Result<OutboxEvent[]>>;
  findScheduled(
    beforeDate: Date,
    limit?: number
  ): Promise<Result<OutboxEvent[]>>;
  markProcessing(eventId: string): Promise<Result<void>>;
  markCompleted(eventId: string): Promise<Result<void>>;
  markFailed(eventId: string, error: string): Promise<Result<void>>;
  incrementRetry(eventId: string): Promise<Result<void>>;
  deleteOld(daysOld: number): Promise<Result<number>>;
}

/**
 * Notification Service Port (for FCM push notifications)
 */
export interface INotificationService {
  sendPush(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      priority?: "normal" | "high";
    }
  ): Promise<Result<{ successCount: number; failureCount: number }>>;

  sendMulticast(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      priority?: "normal" | "high";
    }
  ): Promise<
    Result<{
      successCount: number;
      failureCount: number;
      invalidTokens: string[];
    }>
  >;
}
