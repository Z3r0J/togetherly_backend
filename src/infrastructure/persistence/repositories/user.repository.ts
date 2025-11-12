import { User } from "@domain/entities";
import { IUserRepository } from "@domain/ports/account.repository";
import { Result } from "@shared/types";
import { DataSource, Repository } from "typeorm";
import { UserSchema } from "../schemas/account";

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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error creating test";
      return Result.fail(message, 500);
    }
  }
  async findById(id: string): Promise<Result<User | null>> {
    try {
      const user = await this.repository.findOne({ where: { id } });
      return Result.ok(user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error fetching user";
      return Result.fail(message, 500);
    }
  }
  async findByEmail(email: string): Promise<Result<User | null>> {
    try {
      const user = await this.repository.findOne({ where: { email } });
      return Result.ok(user);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error fetching user";
      return Result.fail(message, 500);
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error updating user";
      return Result.fail(message, 500);
    }
  }
  async softDelete(id: string): Promise<Result<void>> {
    try {
      await this.repository.softDelete(id);
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error deleting user";
      return Result.fail(message, 500);
    }
  }
}
