import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { ICircleRepository } from "@domain/ports/circle.repository.js";

/**
 * Get Circle by Share Token Use Case
 * Public endpoint to preview circle details before joining
 */

export interface GetCircleByShareTokenInput {
  shareToken: string;
}

export interface GetCircleByShareTokenResult {
  circleId: string;
  name: string;
  description?: string;
  color?: string;
  ownerName: string;
}

export interface GetCircleByShareTokenDeps {
  circleRepo: ICircleRepository;
}

export class GetCircleByShareTokenUseCase {
  constructor(private deps: GetCircleByShareTokenDeps) {}

  async execute(
    input: GetCircleByShareTokenInput
  ): Promise<Result<GetCircleByShareTokenResult>> {
    const { shareToken } = input;

    // Find circle by share token
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

    return Result.ok({
      circleId: circle.id!,
      name: circle.name,
      description: circle.description,
      color: circle.color,
      ownerName: circle.owner?.name || "Unknown",
    });
  }
}
