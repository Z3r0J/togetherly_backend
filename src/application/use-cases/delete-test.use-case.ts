import { Result } from "@shared/types/Result.js";
import { ITestRepository } from "@domain/ports/test.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";

/**
 * Delete Test Use Case
 */
export class DeleteTestUseCase {
  constructor(
    private readonly testRepository: ITestRepository,
    private readonly logger: ILogger
  ) {}

  async execute(id: number): Promise<Result<void>> {
    if (!id || id <= 0) {
      return Result.fail("Invalid ID provided", 400);
    }

    // Check if test exists
    const existingTest = await this.testRepository.findById(id);
    if (!existingTest.ok) {
      return existingTest;
    }

    if (!existingTest.data) {
      this.logger.warn("Test not found for deletion", { id });
      return Result.fail(`Test with ID ${id} not found`, 404);
    }

    // Delete
    this.logger.info("Deleting test", { id });
    const result = await this.testRepository.delete(id);

    if (!result.ok) {
      this.logger.error("Failed to delete test", undefined, {
        id,
        error: result.error,
      });
      return result;
    }

    this.logger.info("Test deleted successfully", { id });
    return result;
  }
}
