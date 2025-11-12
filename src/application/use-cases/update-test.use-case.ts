import { Result } from "@shared/types/Result.js";
import { Test } from "@domain/entities/test.entity.js";
import { ITestRepository } from "@domain/ports/test.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";
import { updateTestSchema, UpdateTestInput } from "../schemas/test.schema.js";

/**
 * Update Test Use Case
 */
export class UpdateTestUseCase {
  constructor(
    private readonly testRepository: ITestRepository,
    private readonly logger: ILogger
  ) {}

  async execute(id: number, input: UpdateTestInput): Promise<Result<Test>> {
    if (!id || id <= 0) {
      return Result.fail("Invalid ID provided", 400);
    }

    // Validate input
    const validation = updateTestSchema.safeParse(input);
    if (!validation.success) {
      const errors = validation.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      this.logger.warn("Validation failed for update test", {
        errors,
        input,
        id,
      });
      return Result.fail(errors, 400);
    }

    // Check if test exists
    const existingTest = await this.testRepository.findById(id);
    if (!existingTest.ok) {
      return existingTest;
    }

    if (!existingTest.data) {
      this.logger.warn("Test not found for update", { id });
      return Result.fail(`Test with ID ${id} not found`, 404);
    }

    // Update
    this.logger.info("Updating test", { id, changes: validation.data });
    const result = await this.testRepository.update(id, validation.data);

    if (!result.ok) {
      this.logger.error("Failed to update test", undefined, {
        id,
        error: result.error,
      });
      return result;
    }

    if (!result.data) {
      return Result.fail(`Test with ID ${id} not found after update`, 404);
    }

    this.logger.info("Test updated successfully", { id });
    return Result.ok(result.data);
  }
}
