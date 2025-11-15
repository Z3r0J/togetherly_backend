/**
 * Token port - Domain interface for JWT token management
 * Implementation will be in infrastructure layer
 */

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type TokenPayload = {
  userId: string;
  email?: string;
  [key: string]: unknown;
};

export interface ITokenService {
  /**
   * Issue a new access and refresh token pair
   * @param userId - The user ID to encode in the token
   * @param additionalClaims - Additional claims to include in the token
   * @returns Promise with access and refresh tokens
   */
  issue(
    userId: string,
    additionalClaims?: Record<string, unknown>
  ): Promise<TokenPair>;

  /**
   * Verify and decode an access token
   * @param token - The token to verify
   * @returns Promise with the decoded payload or null if invalid
   */
  verifyAccessToken(token: string): Promise<TokenPayload | null>;

  /**
   * Verify and decode a refresh token
   * @param token - The refresh token to verify
   * @returns Promise with the decoded payload or null if invalid
   */
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;

  /**
   * Generate a verification token (for email verification)
   * @param userId - The user ID to encode in the token
   * @returns Promise with the verification token
   */
  issueVerificationToken(userId: string): Promise<string>;

  /**
   * Verify a verification token
   * @param token - The token to verify
   * @returns Promise with the decoded payload or null if invalid
   */
  verifyVerificationToken(token: string): Promise<TokenPayload | null>;
}
