import { Circle } from "@domain/entities/circles/circle.entity.js";
import { ICircleRepository } from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode, mapDatabaseError } from "@shared/errors/index.js";
import { DataSource, Repository } from "typeorm";
import { CircleSchema } from "../schemas/circles/circle.schema.js";

export class CircleRepository implements ICircleRepository {
  private repository: Repository<Circle>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(CircleSchema);
  }

  async create(circle: Circle): Promise<Result<Circle>> {
    try {
      const savedCircle = await this.repository.save(circle);
      return Result.ok(savedCircle);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating circle";
      const errorCode = mapDatabaseError(error);
      return Result.fail(
        message,
        500,
        errorCode || ErrorCode.CIRCLE_CREATE_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async findById(id: string): Promise<Result<Circle | null>> {
    try {
      const circle = await this.repository.findOne({
        where: { id, isDeleted: false },
      });
      return Result.ok(circle);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error fetching circle";
      return Result.fail(message, 500);
    }
  }

  async findByIdWithMembers(id: string): Promise<Result<Circle | null>> {
    try {
      const circle = await this.repository.findOne({
        where: { id, isDeleted: false },
        relations: ["owner", "events"],
      });
      return Result.ok(circle);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error fetching circle";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByShareToken(shareToken: string): Promise<Result<Circle | null>> {
    try {
      const circle = await this.repository.findOne({
        where: { shareToken, isDeleted: false },
        relations: ["owner"],
      });
      return Result.ok(circle);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error fetching circle by share token";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async update(
    id: string,
    updates: Partial<Circle>
  ): Promise<Result<Circle | null>> {
    try {
      await this.repository.update(id, updates);
      const updated = await this.repository.findOne({
        where: { id, isDeleted: false },
      });
      return Result.ok(updated);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error updating circle";
      const errorCode = mapDatabaseError(error);
      return Result.fail(
        message,
        500,
        errorCode || ErrorCode.CIRCLE_UPDATE_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async softDelete(id: string): Promise<Result<void>> {
    try {
      await this.repository.update(id, {
        isDeleted: true,
        deletedAt: new Date(),
      });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deleting circle";
      const errorCode = mapDatabaseError(error);
      return Result.fail(
        message,
        500,
        errorCode || ErrorCode.CIRCLE_DELETE_FAILED,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async listMyCircles(
    userId: string
  ): Promise<Result<Array<Circle & { memberCount?: number; role?: string }>>> {
    try {
      // Query to get circles where user is owner or member
      const circles = await this.repository
        .createQueryBuilder("circle")
        .leftJoin("circle_members", "member", "member.circle_id = circle.id")
        .where("circle.isDeleted = :isDeleted", { isDeleted: false })
        .andWhere(
          "(circle.owner_id = :userId OR (member.user_id = :userId AND member.isDeleted = :isDeleted))",
          { userId, isDeleted: false }
        )
        .select([
          "circle.*",
          "COUNT(DISTINCT member.id) as memberCount",
          "MAX(CASE WHEN circle.owner_id = :userId THEN 'owner' WHEN member.user_id = :userId THEN member.role END) as role",
        ])
        .groupBy("circle.id")
        .getRawMany();

      return Result.ok(circles);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error listing circles";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
