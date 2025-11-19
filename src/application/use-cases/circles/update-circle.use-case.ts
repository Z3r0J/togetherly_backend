import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";

export type UpdateCircleInput = {
  circleId: string;
  userId: string;
  updates: {
    name?: string;
    description?: string;
    color?: string;
    privacy?: "public" | "invite-only";
  };
};

export type UpdateCircleResult = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  privacy: string;
};

export type UpdateCircleDependencies = {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
};

/**
 * Update Circle Use Case
 * Updates a circle (only owner or admin can update)
 */
export class UpdateCircleUseCase {
  constructor(private deps: UpdateCircleDependencies) {}

  async execute(input: UpdateCircleInput): Promise<Result<UpdateCircleResult>> {
    const { circleId, userId, updates } = input;

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

    // Check user permissions
    const roleResult = await this.deps.circleMemberRepo.getUserRole(
      circleId,
      userId
    );

    if (!roleResult.ok || !roleResult.data) {
      return Result.fail(
        "You are not a member of this circle",
        403,
        ErrorCode.NOT_CIRCLE_MEMBER
      );
    }

    const userRole = roleResult.data;

    // Only owner and admin can update
    if (userRole !== "owner" && userRole !== "admin") {
      return Result.fail(
        "Only owners and admins can update circles",
        403,
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // Update circle
    const updateResult = await this.deps.circleRepo.update(circleId, updates);

    if (!updateResult.ok) {
      return Result.fail(
        updateResult.error,
        500,
        updateResult.errorCode || ErrorCode.CIRCLE_UPDATE_FAILED,
        updateResult.details
      );
    }

    if (!updateResult.data) {
      return Result.fail(
        "Circle not found after update",
        404,
        ErrorCode.CIRCLE_NOT_FOUND
      );
    }

    const updatedCircle = updateResult.data;

    const result: UpdateCircleResult = {
      id: updatedCircle.id!,
      name: updatedCircle.name,
      description: updatedCircle.description,
      color: updatedCircle.color,
      privacy: updatedCircle.privacy!,
    };

    return Result.ok(result, 200);
  }
}
