import {
  IMagicLinkRepository,
  IUserRepository,
} from "@domain/ports/account.repository.js";
import { ITokenService, TokenPair } from "@domain/ports/token.port.js";
import { IClock } from "@domain/ports/clock.port.js";
import { Result } from "@shared/types/index.js";

export type ValidateMagicLinkInput = {
  token: string;
};

export type ValidateMagicLinkResult = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  tokens: TokenPair;
};

export type ValidateMagicLinkDependencies = {
  magicLinkRepo: IMagicLinkRepository;
  userRepo: IUserRepository;
  tokenService: ITokenService;
  clock: IClock;
};

/**
 * Validate Magic Link Use Case
 * Validates the magic link token and returns user info with JWT tokens
 */
export class ValidateMagicLinkUseCase {
  constructor(private deps: ValidateMagicLinkDependencies) {}

  async execute(
    input: ValidateMagicLinkInput
  ): Promise<Result<ValidateMagicLinkResult>> {
    const { token } = input;

    // Find magic link token
    const magicLinkResult = await this.deps.magicLinkRepo.find(token);

    if (!magicLinkResult.ok) {
      return Result.fail(
        magicLinkResult.error || "Failed to validate token",
        500
      );
    }

    if (!magicLinkResult.data) {
      return Result.fail("Invalid or expired magic link", 401);
    }

    const magicLink = magicLinkResult.data;

    // Check if already used
    if (magicLink.usedAt) {
      return Result.fail("Magic link has already been used", 401);
    }

    // Check if expired
    const now = this.deps.clock.now();
    if (now > magicLink.expiresAt) {
      return Result.fail("Magic link has expired", 401);
    }

    // Mark token as used
    const markUsedResult = await this.deps.magicLinkRepo.markUsed(token, now);

    if (!markUsedResult.ok) {
      return Result.fail(
        markUsedResult.error || "Failed to mark token as used",
        500
      );
    }

    // Get user
    const userResult = await this.deps.userRepo.findById(magicLink.userId);

    if (!userResult.ok || !userResult.data) {
      return Result.fail("User not found", 404);
    }

    const user = userResult.data;

    // If email not verified, mark it as verified now
    if (!user.isEmailVerified) {
      await this.deps.userRepo.update(user.id!, {
        isEmailVerified: true,
        emailVerifiedAt: now,
      });
    }

    // Issue JWT tokens
    const tokens = await this.deps.tokenService.issue(user.id!, {
      email: user.email,
    });

    const result: ValidateMagicLinkResult = {
      user: {
        id: user.id!,
        email: user.email,
        name: user.name,
      },
      tokens,
    };

    return Result.ok(result, 200);
  }
}
