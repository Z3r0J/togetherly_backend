import { Request, Response, NextFunction } from "express";
import { Env } from "@app/schemas/env.schema.js";
import { ITokenService } from "@domain/ports/token.port.js";

/**
 * API Key authentication middleware
 */
export const createApiKeyMiddleware = (env: Env) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!env.API_KEY) {
      // If no API key is configured, allow all requests
      next();
      return;
    }

    const apiKey = req.headers["x-api-key"];

    if (apiKey !== env.API_KEY) {
      res.status(401).json({
        success: false,
        error: "Invalid or missing API key",
      });
      return;
    }

    next();
  };
};

/**
 * JWT authentication middleware
 * Verifies the JWT token from the Authorization header and attaches user info to the request
 */
export const createJwtAuthMiddleware = (tokenService: ITokenService) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          success: false,
          error: "Missing or invalid authorization header",
        });
        return;
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      const payload = await tokenService.verifyAccessToken(token);

      if (!payload) {
        res.status(401).json({
          success: false,
          error: "Invalid or expired token",
        });
        return;
      }

      // Attach user info to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: "Authentication failed",
      });
    }
  };
};
