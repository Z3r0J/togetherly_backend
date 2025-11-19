import { Router } from "express";
import { EventController } from "../controllers/event.controller.js";
import { ITokenService } from "@domain/ports/token.port.js";
import { createJwtAuthMiddleware } from "../middlewares/auth.middleware.js";

/**
 * Event Routes
 */
export const createEventRoutes = (
  eventController: EventController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const jwtAuth = createJwtAuthMiddleware(tokenService);

  // All routes require authentication
  router.use(jwtAuth);

  // Create event
  router.post("/", eventController.createEvent);

  // Get event detail
  router.get("/:id", eventController.getEventDetail);

  // Update event
  router.put("/:id", eventController.updateEvent);

  // Delete event
  router.delete("/:id", eventController.deleteEvent);

  // Update RSVP
  router.post("/:id/rsvp", eventController.updateRsvp);

  // Vote for event time
  router.post("/:id/vote", eventController.voteEventTime);

  // Lock event with selected time
  router.post("/:id/lock", eventController.lockEvent);

  // Finalize event (auto-select winning time)
  router.post("/:id/finalize", eventController.finalizeEvent);

  return router;
};
