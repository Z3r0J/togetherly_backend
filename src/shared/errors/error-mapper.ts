import { ErrorCode } from "./error-codes.js";

/**
 * Database Error Patterns
 * Maps database error codes/messages to standardized error codes
 */
const DB_ERROR_PATTERNS = {
  // MySQL/MariaDB error codes
  ER_DUP_ENTRY: ErrorCode.DUPLICATE_ENTRY,
  ER_NO_REFERENCED_ROW: ErrorCode.FOREIGN_KEY_CONSTRAINT,
  ER_ROW_IS_REFERENCED: ErrorCode.FOREIGN_KEY_CONSTRAINT,
  ER_NO_REFERENCED_ROW_2: ErrorCode.FOREIGN_KEY_CONSTRAINT,
  ER_ROW_IS_REFERENCED_2: ErrorCode.FOREIGN_KEY_CONSTRAINT,

  // PostgreSQL error codes
  "23505": ErrorCode.DUPLICATE_ENTRY, // unique_violation
  "23503": ErrorCode.FOREIGN_KEY_CONSTRAINT, // foreign_key_violation
  "23502": ErrorCode.VALIDATION_FAILED, // not_null_violation
  "23514": ErrorCode.VALIDATION_FAILED, // check_violation
};

/**
 * Specific Database Constraint Mappings
 * Maps specific constraint violations to business-logic error codes
 */
const CONSTRAINT_MAPPINGS: Record<string, ErrorCode> = {
  // User constraints
  IDX_USER_EMAIL: ErrorCode.EMAIL_ALREADY_EXISTS,
  "users.IDX_USER_EMAIL": ErrorCode.EMAIL_ALREADY_EXISTS,
  users_email_key: ErrorCode.EMAIL_ALREADY_EXISTS,

  // Circle constraints
  circles_name_key: ErrorCode.CIRCLE_ALREADY_EXISTS,

  // Event constraints
  events_title_key: ErrorCode.EVENT_CREATE_FAILED,
};

/**
 * Error Message Patterns
 * Maps error message patterns to standardized error codes
 */
const MESSAGE_PATTERNS: Array<{ pattern: RegExp; code: ErrorCode }> = [
  {
    pattern: /duplicate entry.*for key.*email/i,
    code: ErrorCode.EMAIL_ALREADY_EXISTS,
  },
  { pattern: /duplicate.*email/i, code: ErrorCode.EMAIL_ALREADY_EXISTS },
  {
    pattern: /foreign key constraint/i,
    code: ErrorCode.FOREIGN_KEY_CONSTRAINT,
  },
  { pattern: /not found/i, code: ErrorCode.NOT_FOUND },
  { pattern: /already exists/i, code: ErrorCode.DUPLICATE_ENTRY },
  { pattern: /invalid.*token/i, code: ErrorCode.INVALID_TOKEN },
  { pattern: /expired.*token/i, code: ErrorCode.TOKEN_EXPIRED },
  { pattern: /unauthorized/i, code: ErrorCode.UNAUTHORIZED },
];

/**
 * Maps database errors to standardized error codes
 */
export function mapDatabaseError(error: any): ErrorCode {
  if (!error) return ErrorCode.UNKNOWN_ERROR;

  // Check for MySQL/MariaDB error codes
  const sqlCode = error.code || error.errno;
  if (sqlCode && typeof sqlCode === "string" && sqlCode in DB_ERROR_PATTERNS) {
    return DB_ERROR_PATTERNS[sqlCode as keyof typeof DB_ERROR_PATTERNS];
  }

  // Check for PostgreSQL error codes
  const pgCode = error.code || error.driverError?.code;
  if (pgCode && typeof pgCode === "string" && pgCode in DB_ERROR_PATTERNS) {
    return DB_ERROR_PATTERNS[pgCode as keyof typeof DB_ERROR_PATTERNS];
  }

  // Check for specific constraint violations in message
  const message = error.message || error.sqlMessage || String(error);

  // Try to extract constraint name from message
  for (const [constraint, errorCode] of Object.entries(CONSTRAINT_MAPPINGS)) {
    if (message.includes(constraint)) {
      return errorCode;
    }
  }

  // Check message patterns
  for (const { pattern, code } of MESSAGE_PATTERNS) {
    if (pattern.test(message)) {
      return code;
    }
  }

  // Default to generic database error
  return ErrorCode.DATABASE_ERROR;
}

/**
 * Gets a user-friendly message for an error code
 * Note: These are fallback messages. Flutter app should provide translations.
 */
export function getErrorMessage(errorCode: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    // Auth errors
    [ErrorCode.UNAUTHORIZED]: "You are not authorized to perform this action",
    [ErrorCode.FORBIDDEN]: "Access forbidden",
    [ErrorCode.INVALID_CREDENTIALS]: "Invalid email or password",
    [ErrorCode.INVALID_TOKEN]: "Invalid authentication token",
    [ErrorCode.TOKEN_EXPIRED]: "Your session has expired",
    [ErrorCode.SESSION_EXPIRED]:
      "Your session has expired. Please log in again",
    [ErrorCode.INSUFFICIENT_PERMISSIONS]:
      "You don't have permission to perform this action",
    [ErrorCode.INVALID_API_KEY]: "Invalid API key",

    // Registration
    [ErrorCode.EMAIL_ALREADY_EXISTS]: "This email is already registered",
    [ErrorCode.INVALID_EMAIL_FORMAT]: "Invalid email format",
    [ErrorCode.WEAK_PASSWORD]: "Password is too weak",
    [ErrorCode.PASSWORDS_DO_NOT_MATCH]: "Passwords do not match",
    [ErrorCode.REGISTRATION_FAILED]: "Registration failed. Please try again",

    // Email verification
    [ErrorCode.EMAIL_NOT_VERIFIED]: "Please verify your email address",
    [ErrorCode.EMAIL_ALREADY_VERIFIED]: "Email is already verified",
    [ErrorCode.VERIFICATION_TOKEN_INVALID]: "Invalid verification token",
    [ErrorCode.VERIFICATION_TOKEN_EXPIRED]: "Verification token has expired",

    // Magic link
    [ErrorCode.MAGIC_LINK_INVALID]: "Invalid magic link",
    [ErrorCode.MAGIC_LINK_EXPIRED]: "Magic link has expired",
    [ErrorCode.MAGIC_LINK_ALREADY_USED]: "Magic link has already been used",
    [ErrorCode.MAGIC_LINK_NOT_FOUND]: "Magic link not found",

    // User
    [ErrorCode.USER_NOT_FOUND]: "User not found",
    [ErrorCode.USER_ALREADY_EXISTS]: "User already exists",
    [ErrorCode.USER_DELETED]: "User has been deleted",
    [ErrorCode.USER_UPDATE_FAILED]: "Failed to update user",
    [ErrorCode.USER_DELETE_FAILED]: "Failed to delete user",

    // Circles
    [ErrorCode.CIRCLE_NOT_FOUND]: "Circle not found",
    [ErrorCode.CIRCLE_ALREADY_EXISTS]: "Circle already exists",
    [ErrorCode.CIRCLE_CREATE_FAILED]: "Failed to create circle",
    [ErrorCode.CIRCLE_UPDATE_FAILED]: "Failed to update circle",
    [ErrorCode.CIRCLE_DELETE_FAILED]: "Failed to delete circle",
    [ErrorCode.CIRCLE_NAME_REQUIRED]: "Circle name is required",
    [ErrorCode.CIRCLE_INVALID_PRIVACY]: "Invalid privacy setting",

    // Circle members
    [ErrorCode.NOT_CIRCLE_MEMBER]: "You are not a member of this circle",
    [ErrorCode.NOT_CIRCLE_OWNER]:
      "Only the circle owner can perform this action",
    [ErrorCode.ALREADY_CIRCLE_MEMBER]:
      "User is already a member of this circle",
    [ErrorCode.CIRCLE_MEMBER_LIMIT_REACHED]: "Circle member limit reached",
    [ErrorCode.CANNOT_REMOVE_CIRCLE_OWNER]: "Cannot remove circle owner",
    [ErrorCode.MEMBER_ADD_FAILED]: "Failed to add member",
    [ErrorCode.MEMBER_REMOVE_FAILED]: "Failed to remove member",
    [ErrorCode.MEMBER_UPDATE_FAILED]: "Failed to update member",
    [ErrorCode.CIRCLE_MEMBER_PERMISSION_DENIED]:
      "You don't have permission to perform this action",
    [ErrorCode.CIRCLE_MEMBER_ALREADY_EXISTS]:
      "User is already a member of this circle",

    // Circle Invitations
    [ErrorCode.INVITATION_NOT_FOUND]: "Invitation not found",
    [ErrorCode.INVITATION_EXPIRED]: "Invitation has expired",
    [ErrorCode.INVITATION_ALREADY_ACCEPTED]: "Invitation already accepted",
    [ErrorCode.INVITATION_ALREADY_DECLINED]: "Invitation already declined",
    [ErrorCode.INVITATION_EMAIL_MISMATCH]: "Invitation email mismatch",
    [ErrorCode.INVITATION_LIMIT_REACHED]: "Invitation limit reached",
    [ErrorCode.INVITATION_ALREADY_EXISTS]: "Invitation already exists",
    [ErrorCode.INVITATION_CREATE_FAILED]: "Failed to create invitation",
    [ErrorCode.INVITATION_SEND_FAILED]: "Failed to send invitation",

    // Events
    [ErrorCode.EVENT_NOT_FOUND]: "Event not found",
    [ErrorCode.EVENT_CREATE_FAILED]: "Failed to create event",
    [ErrorCode.EVENT_UPDATE_FAILED]: "Failed to update event",
    [ErrorCode.EVENT_DELETE_FAILED]: "Failed to delete event",
    [ErrorCode.EVENT_TITLE_REQUIRED]: "Event title is required",
    [ErrorCode.EVENT_INVALID_STATUS]: "Invalid event status",

    // Event lock/finalize
    [ErrorCode.EVENT_ALREADY_LOCKED]: "Event is already locked",
    [ErrorCode.EVENT_NOT_LOCKED]: "Event is not locked",
    [ErrorCode.EVENT_ALREADY_FINALIZED]: "Event is already finalized",
    [ErrorCode.EVENT_NOT_FINALIZED]: "Event is not finalized",
    [ErrorCode.EVENT_CANNOT_MODIFY_LOCKED]: "Cannot modify a locked event",
    [ErrorCode.EVENT_CANNOT_MODIFY_FINALIZED]:
      "Cannot modify a finalized event",
    [ErrorCode.EVENT_LOCK_FAILED]: "Failed to lock event",
    [ErrorCode.EVENT_FINALIZE_FAILED]: "Failed to finalize event",

    // Event time
    [ErrorCode.EVENT_TIME_NOT_FOUND]: "Event time not found",
    [ErrorCode.EVENT_TIME_REQUIRED]: "At least one event time is required",
    [ErrorCode.EVENT_TIME_INVALID]: "Invalid event time",
    [ErrorCode.EVENT_TIME_CONFLICT]:
      "Event time conflicts with another time slot",
    [ErrorCode.EVENT_NO_TIMES_AVAILABLE]: "No time slots available",

    // RSVP
    [ErrorCode.RSVP_NOT_FOUND]: "RSVP not found",
    [ErrorCode.RSVP_UPDATE_FAILED]: "Failed to update RSVP",
    [ErrorCode.RSVP_INVALID_STATUS]: "Invalid RSVP status",
    [ErrorCode.RSVP_ALREADY_EXISTS]: "RSVP already exists",

    // Voting
    [ErrorCode.VOTE_NOT_FOUND]: "Vote not found",
    [ErrorCode.VOTE_FAILED]: "Failed to record vote",
    [ErrorCode.CANNOT_VOTE_LOCKED_EVENT]: "Cannot vote on a locked event",
    [ErrorCode.ALREADY_VOTED]: "You have already voted",

    // Personal Calendar
    [ErrorCode.PERSONAL_EVENT_NOT_FOUND]: "Personal event not found",
    [ErrorCode.PERSONAL_EVENT_CREATE_FAILED]: "Failed to create personal event",
    [ErrorCode.PERSONAL_EVENT_UPDATE_FAILED]: "Failed to update personal event",
    [ErrorCode.PERSONAL_EVENT_DELETE_FAILED]: "Failed to delete personal event",
    [ErrorCode.PERSONAL_EVENT_TIME_CONFLICT]:
      "This time conflicts with an existing event",
    [ErrorCode.PERSONAL_EVENT_INVALID_TIME]: "Invalid event time",

    // Validation
    [ErrorCode.VALIDATION_FAILED]: "Validation failed",
    [ErrorCode.INVALID_INPUT]: "Invalid input",
    [ErrorCode.REQUIRED_FIELD_MISSING]: "Required field is missing",
    [ErrorCode.INVALID_FORMAT]: "Invalid format",
    [ErrorCode.INVALID_UUID]: "Invalid UUID format",
    [ErrorCode.INVALID_DATE]: "Invalid date format",
    [ErrorCode.INVALID_EMAIL]: "Invalid email format",
    [ErrorCode.INVALID_URL]: "Invalid URL format",
    [ErrorCode.VALUE_TOO_LONG]: "Value is too long",
    [ErrorCode.VALUE_TOO_SHORT]: "Value is too short",
    [ErrorCode.VALUE_OUT_OF_RANGE]: "Value is out of range",

    // Database
    [ErrorCode.DATABASE_ERROR]: "Database error occurred",
    [ErrorCode.DATABASE_CONNECTION_FAILED]: "Failed to connect to database",
    [ErrorCode.DUPLICATE_ENTRY]: "Duplicate entry",
    [ErrorCode.FOREIGN_KEY_CONSTRAINT]: "Related record not found",
    [ErrorCode.TRANSACTION_FAILED]: "Transaction failed",
    [ErrorCode.QUERY_FAILED]: "Database query failed",

    // Generic
    [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error",
    [ErrorCode.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
    [ErrorCode.NOT_FOUND]: "Resource not found",
    [ErrorCode.RESOURCE_NOT_FOUND]: "Resource not found",
    [ErrorCode.NOT_IMPLEMENTED]: "Feature not implemented yet",
    [ErrorCode.RATE_LIMIT_EXCEEDED]:
      "Too many requests. Please try again later",
    [ErrorCode.REQUEST_TIMEOUT]: "Request timeout",
    [ErrorCode.PAYLOAD_TOO_LARGE]: "Request payload too large",
    [ErrorCode.UNKNOWN_ERROR]: "An unknown error occurred",
    [ErrorCode.VALIDATION_ERROR]: "Validation error",
    [ErrorCode.INVALID_REQUEST]: "Invalid request",
    [ErrorCode.MISSING_REQUIRED_FIELD]: "Missing required field",

    // External services
    [ErrorCode.EMAIL_SERVICE_ERROR]: "Email service error",
    [ErrorCode.EMAIL_SEND_FAILED]: "Failed to send email",
    [ErrorCode.STORAGE_SERVICE_ERROR]: "Storage service error",
    [ErrorCode.EXTERNAL_API_ERROR]: "External API error",

    // Notifications
    [ErrorCode.NOTIFICATION_NOT_FOUND]: "Notification not found",
    [ErrorCode.NOTIFICATION_SEND_FAILED]: "Failed to send notification",
    [ErrorCode.DEVICE_TOKEN_INVALID]: "Invalid device token",
    [ErrorCode.OUTBOX_PROCESSING_FAILED]: "Failed to process outbox event",
    [ErrorCode.NOTIFICATION_ACCESS_DENIED]:
      "Access denied to this notification",
  };

  return messages[errorCode] || "An error occurred";
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  errorCode: ErrorCode,
  message?: string,
  details?: any
): {
  success: false;
  errorCode: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
} {
  return {
    success: false,
    errorCode,
    message: message || getErrorMessage(errorCode),
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  };
}
