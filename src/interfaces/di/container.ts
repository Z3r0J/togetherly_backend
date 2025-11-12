import { DataSource } from "typeorm";
import { ILogger } from "@domain/ports/logger.port.js";
import { ITestRepository } from "@domain/ports/test.repository.js";
import { TypeORMTestRepository } from "@infra/persistence/typeorm-test.repository.js";
import {
  CreateTestUseCase,
  GetTestUseCase,
  ListTestsUseCase,
  UpdateTestUseCase,
  DeleteTestUseCase,
} from "@app/use-cases/index.js";
import { TestController } from "../http/controllers/test.controller.js";

/**
 * Simple dependency injection container
 * Centralizes the creation and wiring of all dependencies
 */
export class DIContainer {
  private static testRepository: ITestRepository;
  private static testController: TestController;

  /**
   * Initialize the container with core dependencies
   */
  static initialize(dataSource: DataSource, logger: ILogger): void {
    // Repositories
    this.testRepository = new TypeORMTestRepository(dataSource);

    // Use Cases
    const createTestUseCase = new CreateTestUseCase(
      this.testRepository,
      logger
    );
    const getTestUseCase = new GetTestUseCase(this.testRepository, logger);
    const listTestsUseCase = new ListTestsUseCase(this.testRepository, logger);
    const updateTestUseCase = new UpdateTestUseCase(
      this.testRepository,
      logger
    );
    const deleteTestUseCase = new DeleteTestUseCase(
      this.testRepository,
      logger
    );

    // Controllers
    this.testController = new TestController(
      createTestUseCase,
      getTestUseCase,
      listTestsUseCase,
      updateTestUseCase,
      deleteTestUseCase
    );
  }

  /**
   * Get the test controller instance
   */
  static getTestController(): TestController {
    if (!this.testController) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.testController;
  }

  /**
   * Get the test repository instance (useful for testing or advanced scenarios)
   */
  static getTestRepository(): ITestRepository {
    if (!this.testRepository) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.testRepository;
  }

  /**
   * Clear all instances (useful for testing)
   */
  static reset(): void {
    this.testRepository = null as any;
    this.testController = null as any;
  }
}
