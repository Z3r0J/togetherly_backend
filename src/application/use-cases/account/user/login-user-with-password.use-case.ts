import { loginSchema } from "@app/schemas";
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
    verify(password: string, hash: string): Promise<boolean>;
  };
  tokens: {
    issue(userId: string): Promise<{
      accessToken: string;
      refreshToken: string;
    }>;
  };
};

export type LoginResult = {
  userId: string;
  accessToken: string;
  refreshToken: string;
};

export class LoginWithPasswordUseCase {
  constructor(private deps: Deps) {}

  async execute(input: unknown): Promise<Result<LoginResult>> {
    const { userRepo, credentialRepo, hash, tokens } = this.deps;
    // Validate input
    const dto = loginSchema.safeParse(input);
    if (!dto.success) {
      return Result.fail(
        "Invalid input format",
        400,
        ErrorCode.VALIDATION_FAILED,
        dto.error.flatten().fieldErrors
      );
    }

    // Find user by email
    const userResult = await userRepo.findByEmail(dto.data.email);
    if (!userResult.ok) {
      return Result.fail(
        userResult.error,
        userResult.status,
        userResult.errorCode || ErrorCode.DATABASE_ERROR
      );
    }

    const user = userResult.data;
    if (!user) {
      return Result.fail(
        "Invalid email or password",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Get password hash
    const credentialResult = await credentialRepo.getPasswordHash(user.id!);
    if (!credentialResult.ok) {
      return Result.fail(
        credentialResult.error,
        credentialResult.status,
        credentialResult.errorCode || ErrorCode.DATABASE_ERROR
      );
    }

    const passwordHash = credentialResult.data;
    if (!passwordHash) {
      return Result.fail(
        "Invalid email or password",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Verify password
    const isPasswordValid = await hash.verify(dto.data.password, passwordHash);
    if (!isPasswordValid) {
      return Result.fail(
        "Invalid email or password",
        401,
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Issue tokens
    const tokensResult = await tokens.issue(user.id!);
    if (!tokensResult) {
      return Result.fail(
        "Failed to issue tokens",
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return Result.ok({
      userId: user.id!,
      accessToken: tokensResult.accessToken,
      refreshToken: tokensResult.refreshToken,
    });
  }
}
