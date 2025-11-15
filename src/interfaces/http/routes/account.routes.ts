import { Router } from "express";
import { AccountController } from "@interfaces/http/controllers/index.js";

/**
 * Create account routes
 */
export const createAccountRoutes = (controller: AccountController): Router => {
  const router = Router();
  router.post("/register", controller.registerWithPassword);
  router.post("/login", controller.loginWithPassword);

  return router;
};
