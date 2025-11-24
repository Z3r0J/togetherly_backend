import { Request, Response } from "express";
import { ErrorCode } from "@shared/errors/index.js";
import { INotificationRepository } from "@domain/ports/notification.repository.js";
import { IDeviceTokenRepository } from "@domain/ports/notification.repository.js";
import { NotificationCategory } from "@domain/ports/notification.repository.js";
import { z } from "zod";

// Helper to map plural category names from UI to singular database values
const mapCategory = (category: string): NotificationCategory | undefined => {
  if (category === "all") return undefined;
  if (category === "events") return "event";
  if (category === "circles") return "circle";
  if (category === "rsvps") return "rsvp";
  return undefined;
};

// Request schemas
const RegisterDeviceTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  platform: z.enum(["ios", "android", "web"]),
  deviceName: z.string().optional(),
});

const NotificationActionSchema = z.object({
  action: z.string().min(1, "Action is required"),
});

const GetNotificationsQuerySchema = z.object({
  category: z
    .enum(["all", "events", "circles", "rsvps"])
    .optional()
    .default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const GetUnreadCountQuerySchema = z.object({
  category: z
    .enum(["all", "events", "circles", "rsvps"])
    .optional()
    .default("all"),
});

const MarkAllReadQuerySchema = z.object({
  category: z.enum(["events", "circles", "rsvps"]).optional(),
});

/**
 * Notification Controller
 * Handles HTTP requests for notification operations
 */
export class NotificationController {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly deviceTokenRepository: IDeviceTokenRepository
  ) {}

  /**
   * GET /api/notifications
   * Get paginated notifications for the current user
   */
  getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const validation = GetNotificationsQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { category, page, limit } = validation.data;
      const offset = (page - 1) * limit;

      // Map UI category to database category
      const dbCategory = mapCategory(category);

      // Get notifications
      const result = await this.notificationRepository.findByUserId(userId, {
        category: dbCategory,
        limit,
        offset,
      });

      if (!result.ok) {
        res.status(500).json({
          success: false,
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          notifications: result.data || [],
          pagination: {
            page,
            limit,
            hasMore: (result.data || []).length === limit,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count for the current user
   */
  getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const validation = GetUnreadCountQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { category } = validation.data;

      // Map category for single count (legacy endpoint)
      const dbCategory = mapCategory(category);

      const result = await this.notificationRepository.countUnread(
        userId,
        dbCategory
      );

      if (!result.ok) {
        res.status(500).json({
          success: false,
          errorCode: result.errorCode || ErrorCode.INTERNAL_SERVER_ERROR,
          message: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          count: result.data || 0,
          category,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * PUT /api/notifications/:id/read
   * Mark a notification as read
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      // Verify the notification belongs to the user
      const notifResult = await this.notificationRepository.findById(id);
      if (!notifResult.ok || !notifResult.data) {
        res.status(404).json({
          success: false,
          errorCode: ErrorCode.NOT_FOUND,
          message: "Notification not found",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (notifResult.data.userId !== userId) {
        res.status(403).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "You don't have permission to access this notification",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await this.notificationRepository.markAsRead(id);

      if (!result.ok) {
        res.status(500).json({
          success: false,
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: result.error || "Failed to mark as read",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * PUT /api/notifications/mark-all-read
   * Mark all notifications as read (optionally filtered by category)
   */
  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const validation = MarkAllReadQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { category } = validation.data;

      // Map UI category to database category
      const dbCategory = category ? mapCategory(category) : undefined;

      const result = await this.notificationRepository.markAllAsRead(
        userId,
        dbCategory
      );

      if (!result.ok) {
        res.status(500).json({
          success: false,
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: result.error || "Failed to mark all as read",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          updatedCount: result.data,
          category: category || "all",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * DELETE /api/notifications/:id/dismiss
   * Dismiss a notification (soft delete)
   */
  dismiss = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      // Verify the notification belongs to the user
      const notifResult = await this.notificationRepository.findById(id);
      if (!notifResult.ok || !notifResult.data) {
        res.status(404).json({
          success: false,
          errorCode: ErrorCode.NOT_FOUND,
          message: "Notification not found",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (notifResult.data.userId !== userId) {
        res.status(403).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "You don't have permission to access this notification",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await this.notificationRepository.dismiss(id);

      if (!result.ok) {
        res.status(500).json({
          success: false,
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: result.error || "Failed to dismiss notification",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * POST /api/notifications/device-token
   * Register or update a device token for push notifications
   */
  registerDeviceToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const validation = RegisterDeviceTokenSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { token, platform, deviceName } = validation.data;

      const result = await this.deviceTokenRepository.upsert({
        userId,
        token,
        platform: platform as any,
        deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      });

      if (!result.ok) {
        res.status(500).json({
          success: false,
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
          message: result.error || "Failed to register device token",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * POST /api/notifications/:id/action
   * Handle notification action (Accept/Decline/Resolve/View)
   * This endpoint will delegate to specific use cases based on action type
   */
  handleAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const validation = NotificationActionSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { action } = validation.data;

      // Get the notification to verify ownership and get metadata
      const notifResult = await this.notificationRepository.findById(id);
      if (!notifResult.ok || !notifResult.data) {
        res.status(404).json({
          success: false,
          errorCode: ErrorCode.NOT_FOUND,
          message: "Notification not found",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const notification = notifResult.data;

      if (notification.userId !== userId) {
        res.status(403).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "You don't have permission to access this notification",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // For now, just return the metadata that the client needs
      // The actual action handling will be done by the client using existing endpoints
      // (e.g., Accept invitation -> POST /api/circles/:id/invitations/:invitationId/accept)
      res.status(200).json({
        success: true,
        data: {
          action,
          notificationType: notification.type,
          metadata: notification.metadata,
          message:
            "Action received - client should handle based on action type",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      });
    }
  };
}
