import { Request, Response, NextFunction } from "express";
import { Env } from "@app/schemas/env.schema.js";

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
