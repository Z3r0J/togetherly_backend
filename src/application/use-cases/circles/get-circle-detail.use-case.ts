import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";

export type GetCircleDetailInput = {
  circleId: string;
  userId: string;
};

export type CircleMemberDetail = {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
  joinedAt: Date;
};

export type GetCircleDetailResult = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  privacy: string;
  ownerId: string;
  members: CircleMemberDetail[];
  events?: any[];
  userRole: string;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GetCircleDetailDependencies = {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
};

/**
 * Get Circle Detail Use Case
 * Returns circle details with members list
 */
export class GetCircleDetailUseCase {
  constructor(private deps: GetCircleDetailDependencies) {}

  async execute(
    input: GetCircleDetailInput
  ): Promise<Result<GetCircleDetailResult>> {
    const { circleId, userId } = input;

    // Get circle
    const circleResult = await this.deps.circleRepo.findByIdWithMembers(
      circleId
    );

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

    // Get user's role
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

    // Get all members
    const membersResult = await this.deps.circleMemberRepo.listCircleMembers(
      circleId
    );

    if (!membersResult.ok) {
      return Result.fail(
        membersResult.error,
        500,
        membersResult.errorCode || ErrorCode.DATABASE_ERROR,
        membersResult.details
      );
    }

    const members: CircleMemberDetail[] = membersResult.data!.map((member) => ({
      id: member.id!,
      userId: member.userId,
      role: member.role,
      name: member.user?.name || "Unknown",
      email: member.user?.email || "",
      joinedAt: member.createdAt!,
    }));

    const result: GetCircleDetailResult = {
      id: circle.id!,
      name: circle.name,
      description: circle.description,
      color: circle.color,
      privacy: circle.privacy!,
      ownerId: circle.ownerId,
      members,
      events: circle.events || [],
      userRole,
      canEdit: userRole === "owner" || userRole === "admin",
      canDelete: userRole === "owner",
      createdAt: circle.createdAt!,
      updatedAt: circle.updatedAt!,
    };

    return Result.ok(result, 200);
  }
}
