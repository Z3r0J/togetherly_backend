import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { Circle, CircleMember } from "@domain/entities";
import { Result } from "@shared/types/index.js";

export type CreateCircleInput = {
  name: string;
  description?: string;
  color?: string;
  privacy?: "public" | "invite-only";
  ownerId: string;
};

export type CreateCircleResult = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  privacy: string;
  ownerId: string;
  createdAt: Date;
};

export type CreateCircleDependencies = {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
};

/**
 * Create Circle Use Case
 * Creates a new circle and adds the creator as owner
 */
export class CreateCircleUseCase {
  constructor(private deps: CreateCircleDependencies) {}

  async execute(input: CreateCircleInput): Promise<Result<CreateCircleResult>> {
    // Create circle
    const circle: Circle = {
      name: input.name,
      description: input.description,
      color: input.color,
      privacy: input.privacy || "invite-only",
      ownerId: input.ownerId,
    };

    const createResult = await this.deps.circleRepo.create(circle);

    if (!createResult.ok || !createResult.data) {
      return Result.fail("Failed to create circle", createResult.status || 500);
    }

    const createdCircle = createResult.data;

    // Add owner as member with owner role
    const ownerMember: CircleMember = {
      circleId: createdCircle.id!,
      userId: input.ownerId,
      role: "owner",
    };

    const addMemberResult = await this.deps.circleMemberRepo.addMember(
      ownerMember
    );

    if (!addMemberResult.ok) {
      // Rollback: delete the circle if adding owner fails
      await this.deps.circleRepo.softDelete(createdCircle.id!);
      return Result.fail("Failed to add owner to circle", 500);
    }

    const result: CreateCircleResult = {
      id: createdCircle.id!,
      name: createdCircle.name,
      description: createdCircle.description,
      color: createdCircle.color,
      privacy: createdCircle.privacy!,
      ownerId: createdCircle.ownerId,
      createdAt: createdCircle.createdAt!,
    };

    return Result.ok(result, 201);
  }
}
