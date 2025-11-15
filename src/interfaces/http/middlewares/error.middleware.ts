import { Request, Response, NextFunction } from "express";
import { ILogger } from "@domain/ports/logger.port.js";

/**
 * Global error handler middleware
 */
export const createErrorHandler = (logger: ILogger) => {
  return (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    logger.error("Unhandled error in request", err, {
      method: req.method,
      url: req.url,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  };
};
