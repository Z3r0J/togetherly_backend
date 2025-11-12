import { Result } from "@shared/types/Result.js";
import { Test, createTest } from "@domain/entities/test.entity.js";
import { ITestRepository } from "@domain/ports/test.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";
import { createTestSchema, CreateTestInput } from "../schemas/test.schema.js";

/**
 * Create Test Use Case
 * Business logic for creating a new test
 */
export class CreateTestUseCase {
  constructor(
    private readonly testRepository: ITestRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: CreateTestInput): Promise<Result<Test>> {
    // Validate input
    const validation = createTestSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      this.logger.warn("Validation failed for create test", { errors, input });
      return Result.fail(errors, 400);
    }

    const { name } = validation.data;

    // Create domain entity
    const test = createTest({ name });

    // Persist
    this.logger.info("Creating test", { name });
    const result = await this.testRepository.create(test);

    if (result.ok) {
      this.logger.info("Test created successfully", {
        id: result.data.id,
        name,
      });
    } else {
      this.logger.error("Failed to create test", undefined, {
        error: result.error,
        name,
      });
    }

    return result;
  }
}
