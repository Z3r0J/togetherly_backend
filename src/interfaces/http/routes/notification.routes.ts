import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { ITokenService } from "@domain/ports/token.port.js";
import { createJwtAuthMiddleware } from "../middlewares/auth.middleware.js";

/**
 * Notification Routes
 */
export const createNotificationRoutes = (
  notificationController: NotificationController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const jwtAuth = createJwtAuthMiddleware(tokenService);

  // All routes require authentication
  router.use(jwtAuth);

  // Get notifications (paginated, with optional category filter)
  router.get("/", notificationController.getNotifications);

  // Get unread notification count
  router.get("/unread-count", notificationController.getUnreadCount);

  // Mark all as read (with optional category filter)
  router.put("/mark-all-read", notificationController.markAllAsRead);

  // Register/update device token for push notifications
  router.post("/device-token", notificationController.registerDeviceToken);

  // Mark specific notification as read
  router.put("/:id/read", notificationController.markAsRead);

  // Dismiss notification (soft delete)
  router.delete("/:id/dismiss", notificationController.dismiss);

  // Handle notification action (Accept/Decline/Resolve/View)
  router.post("/:id/action", notificationController.handleAction);

  return router;
};
