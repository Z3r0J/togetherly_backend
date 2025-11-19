import { createUserSchema } from "@app/schemas";
import {
  ICredentialRepository,
  IUserRepository,
} from "@domain/ports/account.repository";
import { Result } from "@shared/types";
import { ErrorCode } from "@shared/errors/index.js";

type Deps = {
  userRepo: IUserRepository;
  credentialRepo: ICredentialRepository;
  hash: {
    make(password: string): Promise<string>;
  };
  clock: () => Date;
  mailer?: {
    sendVerifyEmail(
      userId: string,
      email: string,
      token: string
    ): Promise<void>;
  };
  verifyEmailToken?: {
    issue(userId: string): Promise<string>;
  };
};

export type RegisterResult = {
  userId: string;
};

export class RegisterUserWithPasswordUseCase {
  constructor(private deps: Deps) {}

  async execute(input: unknown): Promise<Result<RegisterResult>> {
    const { userRepo, credentialRepo, hash, clock, mailer, verifyEmailToken } =
      this.deps;

    // Validate input
    const dto = createUserSchema.safeParse(input);
    if (!dto.success) {
      return Result.fail(
        "Invalid input format",
        400,
        ErrorCode.VALIDATION_FAILED,
        dto.error.flatten().fieldErrors
      );
    }

    // Create user
    const now = clock();
    const userResult = await userRepo.create({
      name: dto.data.name,
      email: dto.data.email,
      isEmailVerified: dto.data.isEmailVerified ?? false,
      createdAt: now,
    });

    if (!userResult.ok) {
      return Result.fail(
        userResult.error,
        userResult.status,
        userResult.errorCode || ErrorCode.REGISTRATION_FAILED,
        userResult.details
      );
    }

    const userId = userResult.data.id!;

    // Hash and store password
    const hashedPassword = await hash.make(dto.data.password);
    const credentialResult = await credentialRepo.setPasswordHash(
      userId,
      hashedPassword
    );

    if (!credentialResult.ok) {
      return Result.fail(
        credentialResult.error,
        credentialResult.status,
        credentialResult.errorCode || ErrorCode.REGISTRATION_FAILED,
        credentialResult.details
      );
    }

    // Send verification email (optional)
    if (mailer && verifyEmailToken) {
      try {
        const token = await verifyEmailToken.issue(userId);
        await mailer.sendVerifyEmail(userId, userResult.data.email, token);
      } catch (error: any) {
        // Don't fail registration if email sending fails, just log it
        console.error("Failed to send verification email:", error);
      }
    }

    return Result.ok({ userId });
  }
}
