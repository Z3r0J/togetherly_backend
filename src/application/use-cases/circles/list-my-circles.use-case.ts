import { ICircleRepository } from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";

export type ListMyCirclesInput = {
  userId: string;
};

export type CircleListItem = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  privacy: string;
  memberCount: number;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListMyCirclesResult = {
  circles: CircleListItem[];
};

export type ListMyCirclesDependencies = {
  circleRepo: ICircleRepository;
};

/**
 * List My Circles Use Case
 * Returns all circles where user is owner or member
 */
export class ListMyCirclesUseCase {
  constructor(private deps: ListMyCirclesDependencies) {}

  async execute(
    input: ListMyCirclesInput
  ): Promise<Result<ListMyCirclesResult>> {
    const { userId } = input;

    const listResult = await this.deps.circleRepo.listMyCircles(userId);

    if (!listResult.ok) {
      return Result.fail(listResult.error || "Failed to list circles", 500);
    }

    const circles: CircleListItem[] = listResult.data!.map((circle) => ({
      id: circle.id!,
      name: circle.name,
      description: circle.description,
      color: circle.color,
      privacy: circle.privacy!,
      memberCount: circle.memberCount || 0,
      role: circle.role || "member",
      createdAt: circle.createdAt!,
      updatedAt: circle.updatedAt!,
    }));

    return Result.ok({ circles }, 200);
  }
}
