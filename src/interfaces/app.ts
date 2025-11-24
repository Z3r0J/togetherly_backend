import express, { Express, Request, Response } from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { ILogger } from "@domain/ports/logger.port.js";
import { Env } from "@app/schemas/env.schema.js";
import { createApiKeyMiddleware } from "./http/middlewares/auth.middleware.js";
import { createErrorHandler } from "./http/middlewares/error.middleware.js";
import { DIContainer } from "./di/container.js";
import {
  createAccountRoutes,
  createCircleRoutes,
  createEventRoutes,
  createCalendarRoutes,
  createNotificationRoutes,
} from "./http/routes/index.js";

/**
 * Application configuration and dependency injection
 */
export class App {
  private app: Express;
  private dataSource: DataSource;
  private logger: ILogger;
  private env: Env;

  constructor(dataSource: DataSource, logger: ILogger, env: Env) {
    this.dataSource = dataSource;
    this.logger = logger;
    this.env = env;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (_req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Initialize DI container
    DIContainer.initialize(this.dataSource, this.logger);

    // Get controller and services from container
    const accountController = DIContainer.getAccountController();
    const circleController = DIContainer.getCircleController();
    const eventController = DIContainer.getEventController();
    const calendarController = DIContainer.getCalendarController();
    const notificationController = DIContainer.getNotificationController();
    const tokenService = DIContainer.getTokenService();

    // Register routes
    const apiKeyMiddleware = createApiKeyMiddleware(this.env);
    this.app.use(
      "/api/auth",
      apiKeyMiddleware,
      createAccountRoutes(accountController, tokenService)
    );
    this.app.use(
      "/api/circles",
      apiKeyMiddleware,
      createCircleRoutes(circleController, tokenService)
    );
    this.app.use(
      "/api/events",
      apiKeyMiddleware,
      createEventRoutes(eventController, tokenService)
    );
    this.app.use(
      "/api/calendar",
      apiKeyMiddleware,
      createCalendarRoutes(calendarController, tokenService)
    );
    this.app.use(
      "/api/notifications",
      apiKeyMiddleware,
      createNotificationRoutes(notificationController, tokenService)
    );
  }

  private setupErrorHandling(): void {
    this.app.use(createErrorHandler(this.logger));
  }

  async start(): Promise<void> {
    const port = this.env.PORT;

    // Start the outbox processor for notifications
    const outboxProcessor = DIContainer.getOutboxProcessorService();
    outboxProcessor.start();
    this.logger.info("📬 Outbox processor started");

    return new Promise((resolve) => {
      this.app.listen(port, () => {
        this.logger.info(`🚀 Server running on port ${port}`, {
          environment: this.env.NODE_ENV,
          port,
        });
        resolve();
      });
    });
  }

  async shutdown(): Promise<void> {
    // Stop the outbox processor
    const outboxProcessor = DIContainer.getOutboxProcessorService();
    outboxProcessor.stop();
    this.logger.info("📬 Outbox processor stopped");

    // Close database connection
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.info("🔌 Database connection closed");
    }
  }

  getExpressApp(): Express {
    return this.app;
  }
}
