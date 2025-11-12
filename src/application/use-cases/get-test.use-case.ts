import { Result } from "@shared/types/Result.js";
import { Test } from "@domain/entities/test.entity.js";
import { ITestRepository } from "@domain/ports/test.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";

/**
 * Get Test By ID Use Case
 */
export class GetTestUseCase {
  constructor(
    private readonly testRepository: ITestRepository,
    private readonly logger: ILogger
  ) {}

  async execute(id: number): Promise<Result<Test>> {
    if (!id || id <= 0) {
      return Result.fail("Invalid ID provided", 400);
    }

    this.logger.debug("Fetching test by ID", { id });
    const result = await this.testRepository.findById(id);

    if (!result.ok) {
      this.logger.error("Failed to fetch test", undefined, {
        id,
        error: result.error,
      });
      return result;
    }

    if (!result.data) {
      this.logger.warn("Test not found", { id });
      return Result.fail(`Test with ID ${id} not found`, 404);
    }

    return Result.ok(result.data);
  }
}
