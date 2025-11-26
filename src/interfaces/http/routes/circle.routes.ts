import { Router } from "express";
import { CircleController } from "@interfaces/http/controllers/circle.controller.js";
import { ITokenService } from "@domain/ports/token.port.js";
import { createJwtAuthMiddleware } from "@interfaces/http/middlewares/auth.middleware.js";

/**
 * Create circle routes
 */
export const createCircleRoutes = (
  controller: CircleController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const jwtAuth = createJwtAuthMiddleware(tokenService);

  // Public routes (no authentication)
  // Redirect endpoint for email invitation links
  router.get("/invitations/:token/join", controller.redirectToApp);

  // Get invitation details
  router.get("/invitations/:token", controller.getInvitationDetails);

  // Get circle details by share token (public preview)
  router.get("/share/:shareToken", controller.getCircleByShareToken);

  // All other circle routes require authentication
  router.use(jwtAuth);

  // Create circle
  router.post("/", controller.createCircle);

  // List my circles
  router.get("/", controller.listMyCircles);

  // Send invitations
  router.post("/:circleId/invite", controller.sendInvitation);

  // Accept invitation
  router.post("/invitations/:token/accept", controller.acceptInvitation);

  // Generate share link
  router.post("/:circleId/share-link", controller.generateShareLink);

  // Join via share link
  router.post("/share/:shareToken/join", controller.joinViaShareLink);

  // Get circle detail
  router.get("/:id", controller.getCircleDetail);

  // Update circle
  router.put("/:id", controller.updateCircle);

  // Delete circle
  router.delete("/:id", controller.deleteCircle);

  return router;
};
