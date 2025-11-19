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

  // All circle routes require authentication
  router.use(jwtAuth);

  // Create circle
  router.post("/", controller.createCircle);

  // List my circles
  router.get("/", controller.listMyCircles);

  // Get circle detail
  router.get("/:id", controller.getCircleDetail);

  // Update circle
  router.put("/:id", controller.updateCircle);

  // Delete circle
  router.delete("/:id", controller.deleteCircle);

  return router;
};
