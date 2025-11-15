import jwt, { SignOptions } from "jsonwebtoken";
import {
  ITokenService,
  TokenPair,
  TokenPayload,
} from "@domain/ports/token.port.js";

export type JwtConfig = {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  verificationTokenSecret: string;
  accessTokenExpiry: string; // e.g., "15m", "1h", "1d"
  refreshTokenExpiry: string; // e.g., "7d", "30d"
  verificationTokenExpiry: string; // e.g., "24h", "7d"
};

/**
 * JWT implementation of the Token Service
 * Handles access tokens, refresh tokens, and verification tokens
 */
export class JwtTokenService implements ITokenService {
  constructor(private config: JwtConfig) {}

  /**
   * Issue a new access and refresh token pair
   * @param userId - The user ID to encode in the token
   * @param additionalClaims - Additional claims to include in the token
   * @returns Promise with access and refresh tokens
   */
  async issue(
    userId: string,
    additionalClaims?: Record<string, unknown>
  ): Promise<TokenPair> {
    const accessTokenPayload = {
      userId,
      type: "access",
      ...additionalClaims,
    };

    const refreshTokenPayload = {
      userId,
      type: "refresh",
    };

    const accessTokenOptions: SignOptions = {
      expiresIn: this.config.accessTokenExpiry as any,
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: this.config.refreshTokenExpiry as any,
    };

    const accessToken = jwt.sign(
      accessTokenPayload,
      this.config.accessTokenSecret,
      accessTokenOptions
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      this.config.refreshTokenSecret,
      refreshTokenOptions
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify and decode an access token
   * @param token - The token to verify
   * @returns Promise with the decoded payload or null if invalid
   */
  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.config.accessTokenSecret) as any;

      if (decoded && typeof decoded === "object" && decoded.userId) {
        return decoded as TokenPayload;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify and decode a refresh token
   * @param token - The refresh token to verify
   * @returns Promise with the decoded payload or null if invalid
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.config.refreshTokenSecret) as any;

      if (decoded && typeof decoded === "object" && decoded.userId) {
        return decoded as TokenPayload;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a verification token (for email verification)
   * @param userId - The user ID to encode in the token
   * @returns Promise with the verification token
   */
  async issueVerificationToken(userId: string): Promise<string> {
    const tokenPayload = {
      userId,
      type: "verification",
    };

    const tokenOptions: SignOptions = {
      expiresIn: this.config.verificationTokenExpiry as any,
    };

    const token = jwt.sign(
      tokenPayload,
      this.config.verificationTokenSecret,
      tokenOptions
    );

    return token;
  }

  /**
   * Verify a verification token
   * @param token - The token to verify
   * @returns Promise with the decoded payload or null if invalid
   */
  async verifyVerificationToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(
        token,
        this.config.verificationTokenSecret
      ) as any;

      if (decoded && typeof decoded === "object" && decoded.userId) {
        return decoded as TokenPayload;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
