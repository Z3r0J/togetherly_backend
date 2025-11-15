import { loginSchema } from "@app/schemas";
import {
  ICredentialRepository,
  IUserRepository,
} from "@domain/ports/account.repository";
import { Result } from "@shared/types";

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
        `Invalid input: ${dto.error.flatten().fieldErrors}`,
        400
      );
    }

    // Find user by email
    const userResult = await userRepo.findByEmail(dto.data.email);
    if (!userResult.ok) {
      return Result.fail(
        `Failed to find user: ${userResult.error}`,
        userResult.status
      );
    }

    const user = userResult.data;
    if (!user) {
      return Result.fail("Invalid email or password", 401);
    }

    // Get password hash
    const credentialResult = await credentialRepo.getPasswordHash(user.id!);
    if (!credentialResult.ok) {
      return Result.fail(
        `Failed to get credentials: ${credentialResult.error}`,
        credentialResult.status
      );
    }

    const passwordHash = credentialResult.data;
    if (!passwordHash) {
      return Result.fail("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await hash.verify(dto.data.password, passwordHash);
    if (!isPasswordValid) {
      return Result.fail("Invalid email or password", 401);
    }

    // Issue tokens
    const tokensResult = await tokens.issue(user.id!);
    if (!tokensResult) {
      return Result.fail("Failed to issue tokens", 500);
    }

    return Result.ok({
      userId: user.id!,
      accessToken: tokensResult.accessToken,
      refreshToken: tokensResult.refreshToken,
    });
  }
}
