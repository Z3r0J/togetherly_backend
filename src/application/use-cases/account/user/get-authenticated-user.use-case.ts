import { IUserRepository } from "@domain/ports/account.repository.js";
import { Result } from "@shared/types/index.js";

export type GetAuthenticatedUserInput = {
  userId: string;
};

export type GetAuthenticatedUserResult = {
  id: string;
  email: string;
  name: string;
  isEmailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetAuthenticatedUserDependencies = {
  userRepo: IUserRepository;
};

/**
 * Get Authenticated User Use Case
 * Retrieves the authenticated user's information
 */
export class GetAuthenticatedUserUseCase {
  constructor(private deps: GetAuthenticatedUserDependencies) {}

  async execute(
    input: GetAuthenticatedUserInput
  ): Promise<Result<GetAuthenticatedUserResult>> {
    const { userId } = input;

    // Find user by ID
    const userResult = await this.deps.userRepo.findById(userId);

    if (!userResult.ok) {
      return Result.fail(userResult.error || "Failed to retrieve user", 500);
    }

    if (!userResult.data) {
      return Result.fail("User not found", 404);
    }

    const user = userResult.data;

    // Map to result
    const result: GetAuthenticatedUserResult = {
      id: user.id!,
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return Result.ok(result, 200);
  }
}
