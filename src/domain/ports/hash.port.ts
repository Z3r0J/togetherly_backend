/**
 * Hash port - Domain interface for password hashing
 * Implementation will be in infrastructure layer
 */
export interface IHashService {
  /**
   * Hash a plain text password
   * @param password - The plain text password to hash
   * @returns Promise with the hashed password
   */
  make(password: string): Promise<string>;

  /**
   * Verify a plain text password against a hash
   * @param password - The plain text password to verify
   * @param hash - The hash to compare against
   * @returns Promise with true if password matches, false otherwise
   */
  verify(password: string, hash: string): Promise<boolean>;
}
