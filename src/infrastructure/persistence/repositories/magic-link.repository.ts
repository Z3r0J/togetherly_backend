import { DataSource, Repository } from "typeorm";
import { MagicLinkToken } from "@domain/entities/index.js";
import { IMagicLinkRepository } from "@domain/ports/account.repository.js";
import { Result } from "@shared/types/index.js";
import { MagicLinkSchema } from "../schemas/account/index.js";

function mapRowToDomain(row: MagicLinkToken): MagicLinkToken {
  return {
    id: row.id,
    userId: row.userId,
    token: row.token,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt ?? null,
    createdAt: row.createdAt,
  };
}

export class MagicLinkTokenRepository implements IMagicLinkRepository {
  private repo: Repository<MagicLinkToken>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository<MagicLinkToken>(MagicLinkSchema);
  }

  /**
   * Crea un token (raw) para un usuario con fecha de expiración.
   * Idempotente ante duplicados (si el token ya existe, lo retorna).
   */
  async create(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<Result<MagicLinkToken>> {
    try {
      const entity = this.repo.create({ userId, token, expiresAt });
      await this.repo.save(entity);
      return Result.ok(mapRowToDomain(entity));
    } catch (error: any) {
      const code = error?.code || error?.driverError?.code;
      if (code === "ER_DUP_ENTRY" || code === "23505") {
        // Ya existe ese token: lo devolvemos
        const existing = await this.repo.findOne({ where: { token } });
        if (existing) return Result.ok(mapRowToDomain(existing));
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating magic link token";
      return Result.fail(message, 500);
    }
  }

  /**
   * Busca un token por su valor raw.
   */
  async find(token: string): Promise<Result<MagicLinkToken | null>> {
    try {
      const row = await this.repo.findOne({
        where: { token },
      });
      return Result.ok(row ? mapRowToDomain(row) : null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error fetching magic link token";
      return Result.fail(message, 500);
    }
  }

  /**
   * Marca un token como usado. Idempotente:
   * - Si no existe -> 404
   * - Si ya estaba usado -> OK
   */
  async markUsed(token: string, usedAt: Date): Promise<Result<void>> {
    try {
      const row = await this.repo.findOne({ where: { token } });
      if (!row) return Result.fail("MAGIC_LINK_NOT_FOUND", 404);
      if (row.usedAt) return Result.ok(undefined); // idempotente

      row.usedAt = usedAt;
      await this.repo.save(row);
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error marking magic link as used";
      return Result.fail(message, 500);
    }
  }

  /**
   * Elimina tokens expirados (expiresAt <= now).
   * Devuelve la cantidad de filas afectadas.
   */
  async purgeExpired(now: Date): Promise<Result<number>> {
    try {
      const res = await this.repo
        .createQueryBuilder()
        .delete()
        .where("expiresAt <= :now", { now })
        .execute();

      const affected = typeof res.affected === "number" ? res.affected : 0;
      return Result.ok(affected);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error purging expired magic links";
      return Result.fail(message, 500);
    }
  }
}
