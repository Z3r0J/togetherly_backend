import { IUserRepository } from "@domain/ports/account.repository.js";
import { ITokenService, TokenPair } from "@domain/ports/token.port.js";
import { IClock } from "@domain/ports/clock.port.js";
import { Result } from "@shared/types/index.js";

export type ValidateEmailVerificationInput = {
  token: string;
};

export type ValidateEmailVerificationResult = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  tokens: TokenPair;
};

export type ValidateEmailVerificationDependencies = {
  userRepo: IUserRepository;
  tokenService: ITokenService;
  clock: IClock;
};

/**
 * Validate Email Verification Use Case
 * Validates the email verification token and returns user info with JWT tokens
 * Automatically authenticates the user after successful verification
 */
export class ValidateEmailVerificationUseCase {
  constructor(private deps: ValidateEmailVerificationDependencies) {}

  async execute(
    input: ValidateEmailVerificationInput
  ): Promise<Result<ValidateEmailVerificationResult>> {
    const { token } = input;

    // Verify the verification token
    const payload = await this.deps.tokenService.verifyVerificationToken(token);

    if (!payload || !payload.userId) {
      return Result.fail("Invalid or expired verification token", 401);
    }

    // Get user
    const userResult = await this.deps.userRepo.findById(payload.userId);

    if (!userResult.ok || !userResult.data) {
      return Result.fail("User not found", 404);
    }

    const user = userResult.data;

    // If email not verified, mark it as verified now
    const now = this.deps.clock.now();
    if (!user.isEmailVerified) {
      await this.deps.userRepo.update(user.id!, {
        isEmailVerified: true,
        emailVerifiedAt: now,
      });
    }

    // Issue JWT tokens for automatic authentication
    const tokens = await this.deps.tokenService.issue(user.id!, {
      email: user.email,
    });

    const result: ValidateEmailVerificationResult = {
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
