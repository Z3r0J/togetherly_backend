import { DataSource, Repository } from "typeorm";
import { Result } from "@shared/types/index.js";
import { OAuth, User } from "@domain/entities/index.js";
import { IOAuthAccountRepository } from "@domain/ports/account.repository.js";
import { OAuthSchema, UserSchema } from "../schemas/account/index.js";

export class OAuthRepository implements IOAuthAccountRepository {
  private oAuthRepo: Repository<OAuth>;
  private userRepo: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.oAuthRepo = dataSource.getRepository<OAuth>(OAuthSchema);
    this.userRepo = dataSource.getRepository<User>(UserSchema);
  }

  /**
   * Devuelve el userId vinculado a (provider, providerAccountId)
   */
  async findUserId(
    provider: string,
    providerAccountId: string
  ): Promise<Result<string | null>> {
    try {
      const row = await this.oAuthRepo.findOne({
        where: { provider, providerAccountId },
        select: { userId: true } as any, // EntitySchema typing workaround
      });
      return Result.ok(row?.userId ?? null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error fetching OAuth account";
      return Result.fail(message, 500);
    }
  }

  /**
   * Enlaza userId ⇄ (provider, providerAccountId) de forma idempotente
   */
  async link(
    userId: string,
    provider: string,
    providerAccountId: string
  ): Promise<Result<void>> {
    try {
      // Idempotencia: si ya existe, OK
      const existing = await this.oAuthRepo.findOne({
        where: { provider, providerAccountId },
        select: { userId: true } as any,
      });
      if (existing?.userId === userId) {
        return Result.ok(undefined);
      }
      if (existing && existing.userId !== userId) {
        return Result.fail("PROVIDER_ALREADY_LINKED_TO_ANOTHER_USER", 409);
      }

      // Crear vínculo
      const entity = this.oAuthRepo.create({
        userId,
        provider,
        providerAccountId,
      });
      await this.oAuthRepo.save(entity);
      return Result.ok(undefined);
    } catch (error: any) {
      // Manejo de duplicado (MySQL 1062, Postgres 23505)
      const code = error?.code || error?.driverError?.code;
      if (code === "ER_DUP_ENTRY" || code === "23505") {
        return Result.ok(undefined); // idempotente
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error linking OAuth account";
      return Result.fail(message, 500);
    }
  }

  /**
   * Desvincula el proveedor del usuario (no borra el usuario).
   */
  async unlink(userId: string, provider: string): Promise<Result<void>> {
    try {
      await this.oAuthRepo.delete({ userId, provider } as any);
      return Result.ok(undefined);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error unlinking OAuth account";
      return Result.fail(message, 500);
    }
  }

  /**
   * Flujo típico de primer login OAuth:
   * - Si existe (provider, providerAccountId) → devolver usuario
   * - Si no existe:
   *    - buscar por email; si existe, vincular
   *    - si no, crear usuario y vincular
   *  Todo en transacción para evitar condiciones de carrera.
   */
  async createOrLinkUser(input: {
    email: string;
    name?: string | null;
    provider: string;
    providerAccountId: string;
    emailVerified?: boolean;
  }): Promise<Result<User>> {
    const { email, name, provider, providerAccountId, emailVerified } = input;

    try {
      return await this.dataSource.transaction(async (trx) => {
        const oAuthRepo = trx.getRepository<OAuth>(OAuthSchema);
        const userRepo = trx.getRepository<User>(UserSchema);

        // 1) ¿Existe ya el vínculo?
        const existing = await oAuthRepo.findOne({
          where: { provider, providerAccountId },
        });
        if (existing) {
          const user = await userRepo.findOne({
            where: { id: existing.userId } as any,
          });
          if (!user) return Result.fail<User>("LINKED_USER_NOT_FOUND", 500);
          return Result.ok<User>(user as User);
        }

        // 2) Buscar usuario por email
        let user: User | null = await userRepo.findOne({
          where: { email: email.toLowerCase() } as any,
        });

        // 3) Crear usuario si no existe
        if (!user) {
          const newUser = userRepo.create({
            name: name ?? email.split("@")[0],
            email: email.toLowerCase(),
            isEmailVerified: Boolean(emailVerified),
            emailVerifiedAt: emailVerified ? new Date() : null,
          } as any);
          const saved = await userRepo.save(newUser);
          user = Array.isArray(saved) ? (saved[0] as User) : (saved as User);
        } else if (emailVerified && !user.isEmailVerified) {
          // Opcional: elevar verificación si el provider la da como true
          user.isEmailVerified = true as any;
          (user as any).emailVerifiedAt = new Date();
          await userRepo.save(user as any);
        }

        // 4) Vincular OAuth
        const row = oAuthRepo.create({
          userId: (user as any).id,
          provider,
          providerAccountId,
        });
        await oAuthRepo.save(row);

        return Result.ok<User>(user as User);
      });
    } catch (error: any) {
      const code = error?.code || error?.driverError?.code;
      // Choque de carrera: vínculo creado en paralelo → leer y devolver
      if (code === "ER_DUP_ENTRY" || code === "23505") {
        const byProvider = await this.findUserId(provider, providerAccountId);
        if (byProvider.ok && byProvider.data) {
          const user = await this.userRepo.findOne({
            where: { id: byProvider.data } as any,
          });
          if (user) return Result.ok(user);
        }
      }
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error creating or linking OAuth user";
      return Result.fail(message, 500);
    }
  }
}
