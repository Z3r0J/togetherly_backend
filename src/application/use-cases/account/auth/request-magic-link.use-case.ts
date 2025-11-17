import {
  IUserRepository,
  IMagicLinkRepository,
} from "@domain/ports/account.repository.js";
import { IMailerService } from "@domain/ports/mailer.port.js";
import { IClock } from "@domain/ports/clock.port.js";
import { Result } from "@shared/types/index.js";
import { randomBytes } from "crypto";

export type RequestMagicLinkInput = {
  email: string;
};

export type RequestMagicLinkDependencies = {
  userRepo: IUserRepository;
  magicLinkRepo: IMagicLinkRepository;
  mailer: IMailerService;
  clock: IClock;
  tokenExpiryMinutes?: number; // Default: 15 minutes
};

/**
 * Request Magic Link Use Case
 * Generates a magic link token and sends it to the user's email
 */
export class RequestMagicLinkUseCase {
  private readonly tokenExpiryMinutes: number;

  constructor(private deps: RequestMagicLinkDependencies) {
    this.tokenExpiryMinutes = deps.tokenExpiryMinutes || 15;
  }

  async execute(input: RequestMagicLinkInput): Promise<Result<void>> {
    const { email } = input;

    // Find user by email
    const userResult = await this.deps.userRepo.findByEmail(email);

    if (!userResult.ok) {
      return Result.fail(userResult.error || "Failed to find user", 500);
    }

    // For security reasons, don't reveal if user exists or not
    // Just return success in both cases
    if (!userResult.data) {
      // User doesn't exist, but return success to prevent email enumeration
      return Result.ok(undefined, 200);
    }

    const user = userResult.data;

    // Generate a secure random token
    const token = randomBytes(32).toString("hex");

    // Calculate expiry time
    const now = this.deps.clock.now();
    const expiresAt = new Date(
      now.getTime() + this.tokenExpiryMinutes * 60 * 1000
    );

    // Create magic link token
    const createResult = await this.deps.magicLinkRepo.create(
      user.id!,
      token,
      expiresAt
    );

    if (!createResult.ok) {
      return Result.fail(
        createResult.error || "Failed to create magic link",
        500
      );
    }

    // Send magic link email
    try {
      await this.deps.mailer.sendMagicLinkEmail(email, token);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send email";
      return Result.fail(message, 500);
    }

    return Result.ok(undefined, 200);
  }
}
