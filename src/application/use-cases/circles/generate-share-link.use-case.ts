import { randomBytes } from "crypto";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";

/**
 * Generate Share Link Use Case
 * Generates a permanent shareable link for a circle
 */

export interface GenerateShareLinkInput {
  circleId: string;
  userId: string;
}

export interface GenerateShareLinkResult {
  shareLink: string;
  shareToken: string;
}

export interface GenerateShareLinkDeps {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
}

export class GenerateShareLinkUseCase {
  constructor(private deps: GenerateShareLinkDeps) {}

  async execute(
    input: GenerateShareLinkInput
  ): Promise<Result<GenerateShareLinkResult>> {
    const { circleId, userId } = input;

    // 1. Check if circle exists
    const circleResult = await this.deps.circleRepo.findById(circleId);
    if (!circleResult.ok) {
      return Result.fail(
        circleResult.error!,
        circleResult.status!,
        circleResult.errorCode!
      );
    }

    const circle = circleResult.data;
    if (!circle) {
      return Result.fail("Circle not found", 404, ErrorCode.CIRCLE_NOT_FOUND);
    }

    // 2. Check if user is owner or admin
    const roleResult = await this.deps.circleMemberRepo.getUserRole(
      circleId,
      userId
    );
    if (!roleResult.ok) {
      return Result.fail(
        roleResult.error!,
        roleResult.status!,
        roleResult.errorCode!
      );
    }

    const isOwner = circle.ownerId === userId;
    const isAdmin = roleResult.data === "admin";

    if (!isOwner && !isAdmin) {
      return Result.fail(
        "Only circle owner or admin can generate share link",
        403,
        ErrorCode.CIRCLE_MEMBER_PERMISSION_DENIED
      );
    }

    // 3. If share token already exists, return it
    if (circle.shareToken) {
      return Result.ok({
        shareToken: circle.shareToken,
        shareLink: `togetherly://circles/share/${circle.shareToken}`,
      });
    }

    // 4. Generate new share token
    const shareToken = randomBytes(32).toString("hex");

    // 5. Update circle with share token
    const updateResult = await this.deps.circleRepo.update(circleId, {
      shareToken,
    });

    if (!updateResult.ok) {
      return Result.fail(
        updateResult.error!,
        updateResult.status!,
        updateResult.errorCode!
      );
    }

    return Result.ok({
      shareToken,
      shareLink: `togetherly://circles/share/${shareToken}`,
    });
  }
}
