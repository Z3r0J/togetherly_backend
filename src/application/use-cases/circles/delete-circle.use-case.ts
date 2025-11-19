import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";

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
      return Result.fail(circleResult.error || "Failed to find circle", 500);
    }

    if (!circleResult.data) {
      return Result.fail("Circle not found", 404);
    }

    const circle = circleResult.data;

    // Only owner can delete
    if (circle.ownerId !== userId) {
      return Result.fail("Only the owner can delete this circle", 403);
    }

    // Soft delete circle
    const deleteResult = await this.deps.circleRepo.softDelete(circleId);

    if (!deleteResult.ok) {
      return Result.fail(deleteResult.error || "Failed to delete circle", 500);
    }

    return Result.ok(undefined, 200);
  }
}
