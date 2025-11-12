import { Credential } from "@domain/entities";
import { ICredentialRepository } from "@domain/ports/account.repository";
import { Result } from "@shared/types";
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error fetching credential";
      return Result.fail(message, 500);
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error setting credential";
      return Result.fail(message, 500);
    }
  }
}
