import { CircleMember } from "@domain/entities/circles/circle-members.entity.js";
import { ICircleMemberRepository } from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";
import { DataSource, Repository } from "typeorm";
import { CircleMemberSchema } from "../schemas/circles/circle-member.schema.js";

export class CircleMemberRepository implements ICircleMemberRepository {
  private repository: Repository<CircleMember>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(CircleMemberSchema);
  }

  async addMember(member: CircleMember): Promise<Result<CircleMember>> {
    try {
      const saved = await this.repository.save(member);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error adding member";
      return Result.fail(message, 500);
    }
  }

  async findMember(
    circleId: string,
    userId: string
  ): Promise<Result<CircleMember | null>> {
    try {
      const member = await this.repository.findOne({
        where: { circleId, userId, isDeleted: false },
      });
      return Result.ok(member);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error finding member";
      return Result.fail(message, 500);
    }
  }

  async listCircleMembers(circleId: string): Promise<Result<CircleMember[]>> {
    try {
      const members = await this.repository.find({
        where: { circleId, isDeleted: false },
        relations: ["user"],
        order: { createdAt: "ASC" },
      });
      return Result.ok(members);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error listing members";
      return Result.fail(message, 500);
    }
  }

  async updateMemberRole(
    circleId: string,
    userId: string,
    role: string
  ): Promise<Result<void>> {
    try {
      await this.repository.update({ circleId, userId }, { role: role as any });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error updating role";
      return Result.fail(message, 500);
    }
  }

  async removeMember(circleId: string, userId: string): Promise<Result<void>> {
    try {
      await this.repository.update(
        { circleId, userId },
        { isDeleted: true, deletedAt: new Date() }
      );
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error removing member";
      return Result.fail(message, 500);
    }
  }

  async getUserRole(
    circleId: string,
    userId: string
  ): Promise<Result<string | null>> {
    try {
      const member = await this.repository.findOne({
        where: { circleId, userId, isDeleted: false },
        select: ["role"],
      });
      return Result.ok(member?.role || null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error getting role";
      return Result.fail(message, 500);
    }
  }
}
