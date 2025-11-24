import { DataSource, Repository, IsNull } from "typeorm";
import {
  INotificationRepository,
  NotificationCategory,
} from "@domain/ports/notification.repository.js";
import { Notification } from "@domain/entities/index.js";
import { NotificationSchema } from "../schemas/notifications/notification.schema.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/error-codes.js";
import { mapDatabaseError } from "@shared/errors/error-mapper.js";

/**
 * Notification Repository Implementation
 */
export class NotificationRepository implements INotificationRepository {
  private repository: Repository<Notification>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(NotificationSchema);
  }

  async create(notification: Notification): Promise<Result<Notification>> {
    try {
      const saved = await this.repository.save(notification);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating notification";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async createBatch(
    notifications: Notification[]
  ): Promise<Result<Notification[]>> {
    try {
      const saved = await this.repository.save(notifications);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating notifications";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findById(id: string): Promise<Result<Notification | null>> {
    try {
      const notification = await this.repository.findOne({ where: { id } });
      return Result.ok(notification);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding notification";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByUserId(
    userId: string,
    filters?: {
      category?: NotificationCategory;
      isRead?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Notification[]>> {
    try {
      const where: any = {
        userId,
        dismissedAt: IsNull(),
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.isRead !== undefined) {
        where.isRead = filters.isRead;
      }

      const query = this.repository.find({
        where,
        order: { createdAt: "DESC" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      });

      const notifications = await query;
      return Result.ok(notifications);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding notifications";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async markAsRead(notificationId: string): Promise<Result<void>> {
    try {
      await this.repository.update(notificationId, {
        isRead: true,
        readAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error marking notification as read";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async markAllAsRead(
    userId: string,
    category?: NotificationCategory
  ): Promise<Result<void>> {
    try {
      const where: any = {
        userId,
        isRead: false,
        dismissedAt: IsNull(),
      };

      if (category) {
        where.category = category;
      }

      await this.repository.update(where, {
        isRead: true,
        readAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error marking all notifications as read";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async dismiss(notificationId: string): Promise<Result<void>> {
    try {
      await this.repository.update(notificationId, {
        dismissedAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error dismissing notification";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async countUnread(
    userId: string,
    category?: NotificationCategory
  ): Promise<Result<number>> {
    try {
      const where: any = {
        userId,
        isRead: false,
        dismissedAt: IsNull(),
      };

      if (category) {
        where.category = category;
      }

      const count = await this.repository.count({ where });
      return Result.ok(count);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error counting unread notifications";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async deleteOld(daysOld: number): Promise<Result<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.repository
        .createQueryBuilder()
        .delete()
        .where("is_read = :isRead", { isRead: true })
        .andWhere("read_at < :cutoffDate", { cutoffDate })
        .execute();

      return Result.ok(result.affected || 0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deleting old notifications";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
