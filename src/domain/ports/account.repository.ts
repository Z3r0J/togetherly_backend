import { MagicLinkToken, User } from "@domain/entities";
import { Result } from "@shared/types";

// User-only
export interface IUserRepository {
  create(user: User): Promise<Result<User>>;
  findById(id: string): Promise<Result<User | null>>;
  findByEmail(email: string): Promise<Result<User | null>>;
  update(id: string, updates: Partial<User>): Promise<Result<User | null>>;
  softDelete(id: string): Promise<Result<void>>;
}

// Credentials (password)
export interface ICredentialRepository {
  getPasswordHash(userId: string): Promise<Result<string | null>>;
  setPasswordHash(userId: string, hash: string | null): Promise<Result<void>>;
}

// OAuth
export interface IOAuthAccountRepository {
  findUserId(
    provider: string,
    providerAccountId: string
  ): Promise<Result<string | null>>;
  link(
    userId: string,
    provider: string,
    providerAccountId: string
  ): Promise<Result<void>>;
  unlink(userId: string, provider: string): Promise<Result<void>>;
  createOrLinkUser(input: {
    email: string;
    name?: string | null;
    provider: string;
    providerAccountId: string;
    emailVerified?: boolean;
  }): Promise<Result<User>>;
}

// Magic link tokens
export interface IMagicLinkRepository {
  create(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<Result<MagicLinkToken>>;
  find(token: string): Promise<Result<MagicLinkToken | null>>;
  markUsed(token: string, usedAt: Date): Promise<Result<void>>;
  purgeExpired(now: Date): Promise<Result<number>>;
}
