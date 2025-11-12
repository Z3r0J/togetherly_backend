import { Result } from "@shared/types/Result.js";
import { Test } from "@domain/entities/test.entity.js";
import { ITestRepository } from "@domain/ports/test.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";

/**
 * List All Tests Use Case
 */
export class ListTestsUseCase {
  constructor(
    private readonly testRepository: ITestRepository,
    private readonly logger: ILogger
  ) {}

  async execute(): Promise<Result<Test[]>> {
    this.logger.debug("Fetching all tests");
    const result = await this.testRepository.findAll();

    if (!result.ok) {
      this.logger.error("Failed to fetch tests", undefined, {
        error: result.error,
      });
      return result;
    }

    this.logger.info("Tests fetched successfully", {
      count: result.data.length,
    });
    return result;
  }
}
