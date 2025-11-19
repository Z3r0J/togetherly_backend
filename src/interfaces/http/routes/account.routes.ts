import { Router } from "express";
import { AccountController } from "@interfaces/http/controllers/index.js";
import { ITokenService } from "@domain/ports/token.port.js";
import { createJwtAuthMiddleware } from "@interfaces/http/middlewares/auth.middleware.js";

/**
 * Create account routes
 */
export const createAccountRoutes = (
  controller: AccountController,
  tokenService: ITokenService
): Router => {
  const router = Router();
  const jwtAuth = createJwtAuthMiddleware(tokenService);

  // Public routes
  router.post("/register", controller.registerWithPassword);
  router.post("/login", controller.loginWithPassword);
  router.post("/magic-link", controller.requestMagicLink);
  router.post("/validate-magic-link", controller.validateMagicLink);

  // Magic link redirect endpoint (for email links that open apps)
  router.get("/verify-magic-link", controller.validateMagicLinkRedirect);

  // Email verification endpoint (automatically authenticates user)
  router.get("/verify-email", controller.validateEmailVerification);

  // Protected routes
  router.get("/user", jwtAuth, controller.getAuthenticatedUser);

  return router;
};
