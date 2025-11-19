import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";

export type DeleteCircleInput = {
  circleId: string;
  userId: string;
};

export type DeleteCircleDependencies = {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
};

/**
 * Delete Circle Use Case
 * Soft deletes a circle (only owner can delete)
 */
export class DeleteCircleUseCase {
  constructor(private deps: DeleteCircleDependencies) {}

  async execute(input: DeleteCircleInput): Promise<Result<void>> {
    const { circleId, userId } = input;

    // Check if circle exists
    const circleResult = await this.deps.circleRepo.findById(circleId);

    if (!circleResult.ok) {
      return Result.fail(
        circleResult.error,
        500,
        circleResult.errorCode || ErrorCode.DATABASE_ERROR,
        circleResult.details
      );
    }

    if (!circleResult.data) {
      return Result.fail("Circle not found", 404, ErrorCode.CIRCLE_NOT_FOUND);
    }

    const circle = circleResult.data;

    // Only owner can delete
    if (circle.ownerId !== userId) {
      return Result.fail(
        "Only the owner can delete this circle",
        403,
        ErrorCode.NOT_CIRCLE_OWNER
      );
    }

    // Soft delete circle
    const deleteResult = await this.deps.circleRepo.softDelete(circleId);

    if (!deleteResult.ok) {
      return Result.fail(
        deleteResult.error,
        500,
        deleteResult.errorCode || ErrorCode.CIRCLE_DELETE_FAILED,
        deleteResult.details
      );
    }

    return Result.ok(undefined, 200);
  }
}
