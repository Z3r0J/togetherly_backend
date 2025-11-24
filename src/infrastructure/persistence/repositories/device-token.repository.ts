import { DataSource, Repository, LessThan } from "typeorm";
import { IDeviceTokenRepository } from "@domain/ports/notification.repository.js";
import { DeviceToken } from "@domain/entities/index.js";
import { DeviceTokenSchema } from "../schemas/notifications/device-token.schema.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/error-codes.js";
import { mapDatabaseError } from "@shared/errors/error-mapper.js";

/**
 * Device Token Repository Implementation
 */
export class DeviceTokenRepository implements IDeviceTokenRepository {
  private repository: Repository<DeviceToken>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(DeviceTokenSchema);
  }

  async upsert(deviceToken: DeviceToken): Promise<Result<DeviceToken>> {
    try {
      // Check if token already exists
      const existing = await this.repository.findOne({
        where: { token: deviceToken.token },
      });

      if (existing) {
        // Update existing token
        await this.repository.update(existing.id!, {
          userId: deviceToken.userId,
          platform: deviceToken.platform,
          deviceName: deviceToken.deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        });
        const updated = await this.repository.findOne({
          where: { id: existing.id },
        });
        return Result.ok(updated!);
      }

      // Create new token
      const saved = await this.repository.save(deviceToken);
      return Result.ok(saved);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error upserting device token";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByUserId(userId: string): Promise<Result<DeviceToken[]>> {
    try {
      const tokens = await this.repository.find({
        where: { userId, isActive: true },
        order: { lastUsedAt: "DESC" },
      });
      return Result.ok(tokens);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding device tokens";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async findByToken(token: string): Promise<Result<DeviceToken | null>> {
    try {
      const deviceToken = await this.repository.findOne({ where: { token } });
      return Result.ok(deviceToken);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error finding device token";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async deactivate(tokenId: string): Promise<Result<void>> {
    try {
      await this.repository.update(tokenId, { isActive: false });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deactivating device token";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async deactivateByToken(token: string): Promise<Result<void>> {
    try {
      await this.repository.update({ token }, { isActive: false });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deactivating device token by token";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async deleteExpired(daysOld: number): Promise<Result<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.repository.delete({
        isActive: false,
        lastUsedAt: LessThan(cutoffDate),
      });

      return Result.ok(result.affected || 0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error deleting expired device tokens";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async updateLastUsed(tokenId: string): Promise<Result<void>> {
    try {
      await this.repository.update(tokenId, { lastUsedAt: new Date() });
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error updating device token last used";
      const errorCode = mapDatabaseError(error);
      return Result.fail(message, 500, errorCode || ErrorCode.DATABASE_ERROR, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
