import { Credential } from "@domain/entities";
import { ICredentialRepository } from "@domain/ports/account.repository";
import { Result } from "@shared/types";
import { ErrorCode } from "@shared/errors/index.js";
import { DataSource, Repository } from "typeorm";
import { CredentialSchema } from "../schemas/account";

export class CredentialRepository implements ICredentialRepository {
  private repository: Repository<Credential>;
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(CredentialSchema);
  }

  async getPasswordHash(userId: string): Promise<Result<string | null>> {
    try {
      const credential = await this.repository.findOne({ where: { userId } });
      const hash: string | null = credential?.passwordHash ?? null;
      return Result.ok(hash);
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch credential";
      return Result.fail(message, 500, ErrorCode.DATABASE_ERROR, {
        originalError: error.message,
      });
    }
  }
  async setPasswordHash(
    userId: string,
    hash: string | null
  ): Promise<Result<void>> {
    try {
      let credential = await this.repository.findOne({ where: { userId } });
      if (!credential) {
        credential = this.repository.create({
          userId,
          passwordHash: hash ?? undefined,
        });
      } else {
        credential.passwordHash = hash ?? undefined;
      }
      await this.repository.save(credential);
      return Result.ok(undefined);
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : "Failed to save credential";
      return Result.fail(message, 500, ErrorCode.DATABASE_ERROR, {
        originalError: error.message,
      });
    }
  }
}
