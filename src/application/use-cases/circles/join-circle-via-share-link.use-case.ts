import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { IUserRepository } from "@domain/ports/account.repository.js";
import { createCircleMember } from "@domain/entities/circles/circle-members.entity.js";

/**
 * Join Circle via Share Link Use Case
 * Allows a user to join a circle using the permanent share link
 */

export interface JoinCircleViaShareLinkInput {
  shareToken: string;
  userId: string;
  userEmail: string;
}

export interface JoinCircleViaShareLinkResult {
  circleId: string;
  circleName: string;
  message: string;
}

export interface JoinCircleViaShareLinkDeps {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
  userRepo: IUserRepository;
}

export class JoinCircleViaShareLinkUseCase {
  constructor(private deps: JoinCircleViaShareLinkDeps) {}

  async execute(
    input: JoinCircleViaShareLinkInput
  ): Promise<Result<JoinCircleViaShareLinkResult>> {
    const { shareToken, userId } = input;

    // 1. Find circle by share token
    const circleResult = await this.deps.circleRepo.findByShareToken(
      shareToken
    );
    if (!circleResult.ok) {
      return Result.fail(
        circleResult.error!,
        circleResult.status!,
        circleResult.errorCode!
      );
    }

    const circle = circleResult.data;
    if (!circle) {
      return Result.fail("Invalid share link", 404, ErrorCode.CIRCLE_NOT_FOUND);
    }

    // 2. Check if user already exists
    const userResult = await this.deps.userRepo.findById(userId);
    if (!userResult.ok) {
      return Result.fail(
        userResult.error!,
        userResult.status!,
        userResult.errorCode!
      );
    }

    if (!userResult.data) {
      return Result.fail("User not found", 404, ErrorCode.USER_NOT_FOUND);
    }

    // 3. Check if user is already a member
    const existingMemberResult = await this.deps.circleMemberRepo.findMember(
      circle.id!,
      userId
    );

    if (!existingMemberResult.ok) {
      return Result.fail(
        existingMemberResult.error!,
        existingMemberResult.status!,
        existingMemberResult.errorCode!
      );
    }

    if (existingMemberResult.data) {
      return Result.fail(
        "You are already a member of this circle",
        409,
        ErrorCode.ALREADY_CIRCLE_MEMBER
      );
    }

    // 4. Add user as member
    const newMember = createCircleMember({
      circleId: circle.id!,
      userId,
      role: "member",
    });

    const addMemberResult = await this.deps.circleMemberRepo.addMember(
      newMember
    );

    if (!addMemberResult.ok) {
      return Result.fail(
        addMemberResult.error!,
        addMemberResult.status!,
        addMemberResult.errorCode!
      );
    }

    return Result.ok({
      circleId: circle.id!,
      circleName: circle.name,
      message: `Successfully joined ${circle.name}`,
    });
  }
}
