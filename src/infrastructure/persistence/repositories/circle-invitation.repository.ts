import { CircleInvitation } from "@domain/entities/circles/circle-invitation.entity.js";
import { ICircleInvitationRepository } from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode, mapDatabaseError } from "@shared/errors/index.js";
import { DataSource, Repository } from "typeorm";
import { CircleInvitationSchema } from "../schemas/circles/circle-invitation.schema.js";

export class CircleInvitationRepository implements ICircleInvitationRepository {
  private repository: Repository<CircleInvitation>;

  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(CircleInvitationSchema);
  }

  async create(
    invitation: CircleInvitation
  ): Promise<Result<CircleInvitation>> {
    try {
      const saved = await this.repository.save(invitation);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating invitation";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByToken(token: string): Promise<Result<CircleInvitation | null>> {
    try {
      const invitation = await this.repository.findOne({
        where: { token, isDeleted: false },
        relations: ["circle", "inviter"],
      });
      return Result.ok(invitation);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding invitation";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByCircleAndEmail(
    circleId: string,
    email: string
  ): Promise<Result<CircleInvitation | null>> {
    try {
      const invitation = await this.repository.findOne({
        where: {
          circleId,
          invitedEmail: email,
          isDeleted: false,
          status: "pending",
        },
        order: { createdAt: "DESC" },
      });
      return Result.ok(invitation);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding invitation";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async updateStatus(
    id: string,
    status: string,
    acceptedAt?: Date
  ): Promise<Result<void>> {
    try {
      const updateData: any = { status };
      if (acceptedAt) {
        updateData.acceptedAt = acceptedAt;
      }
      await this.repository.update(id, updateData);
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error updating invitation status";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async listPendingInvitations(
    circleId: string
  ): Promise<Result<CircleInvitation[]>> {
    try {
      const invitations = await this.repository.find({
        where: {
          circleId,
          status: "pending",
          isDeleted: false,
        },
        relations: ["inviter"],
        order: { createdAt: "DESC" },
      });
      return Result.ok(invitations);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error listing invitations";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async countPendingInvitations(circleId: string): Promise<Result<number>> {
    try {
      const count = await this.repository.count({
        where: {
          circleId,
          status: "pending",
          isDeleted: false,
        },
      });
      return Result.ok(count);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error counting invitations";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
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
          : "Unknown error deleting invitation";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
