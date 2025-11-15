import bcrypt from "bcrypt";
import { IHashService } from "@domain/ports/hash.port.js";

/**
 * Bcrypt implementation of the Hash Service
 * Uses bcrypt for password hashing with configurable salt rounds
 */
export class BcryptHashService implements IHashService {
  private readonly saltRounds: number;

  constructor(saltRounds: number = 12) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hash a plain text password using bcrypt
   * @param password - The plain text password to hash
   * @returns Promise with the hashed password
   */
  async make(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a plain text password against a bcrypt hash
   * @param password - The plain text password to verify
   * @param hash - The bcrypt hash to compare against
   * @returns Promise with true if password matches, false otherwise
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
