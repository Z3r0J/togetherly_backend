import { User } from "@domain/entities/index.js";
import { IUserRepository } from "@domain/ports/account.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode, mapDatabaseError } from "@shared/errors/index.js";
import { DataSource, Repository } from "typeorm";
import { UserSchema } from "../schemas/account/index.js";

export class UserRepository implements IUserRepository {
  private repository: Repository<User>;
  /**
   *
   */
  constructor(datasource: DataSource) {
    this.repository = datasource.getRepository(UserSchema);
  }

  async create(user: User): Promise<Result<User>> {
    try {
      const saved = await this.repository.save(user);
      return Result.ok(saved);
    } catch (error: any) {
      const errorCode = mapDatabaseError(error);
      const message =
        error instanceof Error ? error.message : "Failed to create user";
      return Result.fail(message, 500, errorCode, {
        originalError: error.message,
      });
    }
  }
  async findById(id: string): Promise<Result<User | null>> {
    try {
      const user = await this.repository.findOne({ where: { id } });
      return Result.ok(user);
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch user";
      return Result.fail(message, 500, ErrorCode.DATABASE_ERROR, {
        originalError: error.message,
      });
    }
  }
  async findByEmail(email: string): Promise<Result<User | null>> {
    try {
      const user = await this.repository.findOne({ where: { email } });
      return Result.ok(user);
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch user";
      return Result.fail(message, 500, ErrorCode.DATABASE_ERROR, {
        originalError: error.message,
      });
    }
  }

  async existsByEmail(email: string): Promise<Result<boolean>> {
    try {
      const user = await this.repository.findOne({
        where: { email },
        select: ["id"],
      });
      return Result.ok(user !== null);
    } catch (error: any) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to check user existence";
      return Result.fail(message, 500, ErrorCode.DATABASE_ERROR, {
        originalError: error.message,
      });
    }
  }
  async update(
    id: string,
    updates: Partial<User>
  ): Promise<Result<User | null>> {
    try {
      await this.repository.update(id, updates);
      const updated = await this.repository.findOne({ where: { id } });
      return Result.ok(updated);
    } catch (error: any) {
      const errorCode = mapDatabaseError(error);
      const message =
        error instanceof Error ? error.message : "Failed to update user";
      return Result.fail(message, 500, errorCode, {
        originalError: error.message,
      });
    }
  }
  async softDelete(id: string): Promise<Result<void>> {
    try {
      await this.repository.softDelete(id);
      return Result.ok(undefined);
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : "Failed to delete user";
      return Result.fail(message, 500, ErrorCode.USER_DELETE_FAILED, {
        originalError: error.message,
      });
    }
  }
}
