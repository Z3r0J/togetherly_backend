import { Router } from "express";
import { TestController } from "../controllers/test.controller.js";

/**
 * Create test routes
 */
export const createTestRoutes = (controller: TestController): Router => {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
};
