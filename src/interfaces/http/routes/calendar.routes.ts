import { Router } from "express";
import { CalendarController } from "@interfaces/http/controllers/calendar.controller.js";
import { ITokenService } from "@domain/ports/token.port.js";
import { createJwtAuthMiddleware } from "@interfaces/http/middlewares/auth.middleware.js";

/**
 * Create calendar routes
 */
export const createCalendarRoutes = (
  controller: CalendarController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const jwtAuth = createJwtAuthMiddleware(tokenService);

  // All calendar routes require authentication
  router.use(jwtAuth);

  // Create personal event
  router.post("/events", controller.createPersonalEvent);

  // List personal events
  router.get("/events", controller.listPersonalEvents);

  // Get personal event detail
  router.get("/events/:id", controller.getPersonalEventDetail);

  // Update personal event
  router.put("/events/:id", controller.updatePersonalEvent);

  // Delete personal event
  router.delete("/events/:id", controller.deletePersonalEvent);

  return router;
};
