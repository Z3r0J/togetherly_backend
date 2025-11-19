import { Request, Response, NextFunction } from "express";
import { ILogger } from "@domain/ports/logger.port.js";
import {
  ErrorCode,
  mapDatabaseError,
  createErrorResponse,
} from "@shared/errors/index.js";

/**
 * Global error handler middleware
 * Transforms all errors to standardized format with error codes
 */
export const createErrorHandler = (logger: ILogger) => {
  return (err: any, req: Request, res: Response, _next: NextFunction): void => {
    // Log the original error for debugging
    logger.error("Unhandled error in request", err, {
      method: req.method,
      url: req.url,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Determine error code and status
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let status = 500;
    let message = "Internal server error";
    let details: any = undefined;

    // Check if it's a database error
    if (err.code || err.errno || err.sqlMessage || err.driverError) {
      errorCode = mapDatabaseError(err);
      status = getStatusCodeForErrorCode(errorCode);
      details = {
        originalError: err.message,
        code: err.code || err.errno,
      };
    }
    // Check if it's a validation error
    else if (err.name === "ValidationError" || err.name === "ZodError") {
      errorCode = ErrorCode.VALIDATION_FAILED;
      status = 400;
      details = err.errors || err.issues;
    }
    // Check if it's an authentication error
    else if (
      err.name === "UnauthorizedError" ||
      err.message?.toLowerCase().includes("unauthorized")
    ) {
      errorCode = ErrorCode.UNAUTHORIZED;
      status = 401;
    }
    // Check if it's a JWT error
    else if (err.name === "JsonWebTokenError") {
      errorCode = ErrorCode.INVALID_TOKEN;
      status = 401;
    } else if (err.name === "TokenExpiredError") {
      errorCode = ErrorCode.TOKEN_EXPIRED;
      status = 401;
    }
    // Check for specific error messages
    else if (err.message) {
      message = err.message;
      // Try to map by message pattern
      errorCode = mapDatabaseError(err);
      status = getStatusCodeForErrorCode(errorCode);
    }

    // Include stack trace in details for debugging (in all environments for transparency)
    if (err.stack) {
      details = {
        ...details,
        stack: err.stack.split("\n").slice(0, 5), // First 5 lines of stack trace
      };
    }

    // Create standardized error response
    const errorResponse = createErrorResponse(errorCode, message, details);

    // Add path to error response
    res.status(status).json({
      ...errorResponse,
      path: req.path,
    });
  };
};

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCodeForErrorCode(errorCode: ErrorCode): number {
  const statusMap: Partial<Record<ErrorCode, number>> = {
    // 400 Bad Request
    [ErrorCode.VALIDATION_FAILED]: 400,
    [ErrorCode.INVALID_INPUT]: 400,
    [ErrorCode.REQUIRED_FIELD_MISSING]: 400,
    [ErrorCode.INVALID_FORMAT]: 400,
    [ErrorCode.WEAK_PASSWORD]: 400,
    [ErrorCode.CIRCLE_NAME_REQUIRED]: 400,
    [ErrorCode.EVENT_TITLE_REQUIRED]: 400,
    [ErrorCode.EVENT_ALREADY_LOCKED]: 400,
    [ErrorCode.EVENT_TIME_REQUIRED]: 400,
    [ErrorCode.RSVP_INVALID_STATUS]: 400,

    // 401 Unauthorized
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.INVALID_CREDENTIALS]: 401,
    [ErrorCode.INVALID_TOKEN]: 401,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.SESSION_EXPIRED]: 401,
    [ErrorCode.VERIFICATION_TOKEN_INVALID]: 401,
    [ErrorCode.VERIFICATION_TOKEN_EXPIRED]: 401,
    [ErrorCode.MAGIC_LINK_INVALID]: 401,
    [ErrorCode.MAGIC_LINK_EXPIRED]: 401,

    // 403 Forbidden
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
    [ErrorCode.EMAIL_NOT_VERIFIED]: 403,
    [ErrorCode.NOT_CIRCLE_MEMBER]: 403,
    [ErrorCode.NOT_CIRCLE_OWNER]: 403,
    [ErrorCode.EVENT_CANNOT_MODIFY_LOCKED]: 403,
    [ErrorCode.EVENT_CANNOT_MODIFY_FINALIZED]: 403,
    [ErrorCode.CANNOT_VOTE_LOCKED_EVENT]: 403,

    // 404 Not Found
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.USER_NOT_FOUND]: 404,
    [ErrorCode.CIRCLE_NOT_FOUND]: 404,
    [ErrorCode.EVENT_NOT_FOUND]: 404,
    [ErrorCode.MAGIC_LINK_NOT_FOUND]: 404,
    [ErrorCode.RSVP_NOT_FOUND]: 404,
    [ErrorCode.VOTE_NOT_FOUND]: 404,

    // 408 Request Timeout
    [ErrorCode.REQUEST_TIMEOUT]: 408,

    // 409 Conflict
    [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
    [ErrorCode.USER_ALREADY_EXISTS]: 409,
    [ErrorCode.CIRCLE_ALREADY_EXISTS]: 409,
    [ErrorCode.DUPLICATE_ENTRY]: 409,
    [ErrorCode.ALREADY_CIRCLE_MEMBER]: 409,
    [ErrorCode.RSVP_ALREADY_EXISTS]: 409,
    [ErrorCode.ALREADY_VOTED]: 409,
    [ErrorCode.EVENT_TIME_CONFLICT]: 409,

    // 410 Gone
    [ErrorCode.USER_DELETED]: 410,

    // 413 Payload Too Large
    [ErrorCode.PAYLOAD_TOO_LARGE]: 413,

    // 429 Too Many Requests
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

    // 500 Internal Server Error
    [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.TRANSACTION_FAILED]: 500,
    [ErrorCode.UNKNOWN_ERROR]: 500,

    // 501 Not Implemented
    [ErrorCode.NOT_IMPLEMENTED]: 501,

    // 502 Bad Gateway
    [ErrorCode.EXTERNAL_API_ERROR]: 502,

    // 503 Service Unavailable
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.DATABASE_CONNECTION_FAILED]: 503,
  };

  return statusMap[errorCode] || 500;
}
