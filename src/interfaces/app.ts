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
  }

  private setupErrorHandling(): void {
    this.app.use(createErrorHandler(this.logger));
  }

  async start(): Promise<void> {
    const port = this.env.PORT;

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

  getExpressApp(): Express {
    return this.app;
  }
}
