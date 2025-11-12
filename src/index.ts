import "dotenv/config";
import { validateEnv } from "@app/schemas/env.schema.js";
import { createDataSource } from "@infra/persistence/datasource.js";
import { ConsoleLogger } from "@infra/logger/console.logger.js";
import { App } from "@interfaces/app.js";

/**
 * Application entry point
 */
async function bootstrap(): Promise<void> {
  // Validate environment
  const env = validateEnv();

  // Create logger
  const logger = new ConsoleLogger("Bootstrap");

  try {
    logger.info("Starting application...", { environment: env.NODE_ENV });

    // Initialize database
    logger.info("Connecting to database...");
    const dataSource = createDataSource(env);
    await dataSource.initialize();
    logger.info("Database connected successfully");

    // Create and start application
    const app = new App(dataSource, new ConsoleLogger("App"), env);
    await app.start();
  } catch (error) {
    logger.fatal("Failed to start application", error as Error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  const logger = new ConsoleLogger("Process");
  logger.fatal("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const logger = new ConsoleLogger("Process");
  logger.fatal("Unhandled rejection", reason as Error);
  process.exit(1);
});

bootstrap();
