# Error Codes Reference

This document lists all standardized error codes used by the Togetherly API. These codes are **language-agnostic** and should be translated in the Flutter app based on the user's locale.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "errorCode": "AUTH_EMAIL_ALREADY_EXISTS",
  "message": "This email is already registered",
  "details": { ... },
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

## Error Codes

### Authentication & Authorization (1000-1999)

#### General Auth Errors (1000-1099)

| Error Code                      | Description                                  | HTTP Status |
| ------------------------------- | -------------------------------------------- | ----------- |
| `AUTH_UNAUTHORIZED`             | User is not authorized to perform the action | 401         |
| `AUTH_INVALID_CREDENTIALS`      | Invalid email or password during login       | 401         |
| `AUTH_INVALID_TOKEN`            | The authentication token is invalid          | 401         |
| `AUTH_TOKEN_EXPIRED`            | The authentication token has expired         | 401         |
| `AUTH_SESSION_EXPIRED`          | The user session has expired                 | 401         |
| `AUTH_INSUFFICIENT_PERMISSIONS` | User lacks required permissions              | 403         |
| `AUTH_INVALID_API_KEY`          | The API key provided is invalid              | 401         |

#### Registration Errors (1100-1199)

| Error Code                    | Description                                  | HTTP Status |
| ----------------------------- | -------------------------------------------- | ----------- |
| `AUTH_EMAIL_ALREADY_EXISTS`   | The email is already registered              | 409         |
| `AUTH_INVALID_EMAIL_FORMAT`   | Email format is invalid                      | 400         |
| `AUTH_WEAK_PASSWORD`          | Password does not meet strength requirements | 400         |
| `AUTH_PASSWORDS_DO_NOT_MATCH` | Password confirmation does not match         | 400         |
| `AUTH_REGISTRATION_FAILED`    | Registration process failed                  | 500         |

#### Email Verification (1200-1299)

| Error Code                        | Description                          | HTTP Status |
| --------------------------------- | ------------------------------------ | ----------- |
| `AUTH_EMAIL_NOT_VERIFIED`         | Email address has not been verified  | 403         |
| `AUTH_EMAIL_ALREADY_VERIFIED`     | Email is already verified            | 400         |
| `AUTH_VERIFICATION_TOKEN_INVALID` | Email verification token is invalid  | 401         |
| `AUTH_VERIFICATION_TOKEN_EXPIRED` | Email verification token has expired | 401         |

#### Magic Link (1300-1399)

| Error Code                     | Description                      | HTTP Status |
| ------------------------------ | -------------------------------- | ----------- |
| `AUTH_MAGIC_LINK_INVALID`      | Magic link is invalid            | 401         |
| `AUTH_MAGIC_LINK_EXPIRED`      | Magic link has expired           | 401         |
| `AUTH_MAGIC_LINK_ALREADY_USED` | Magic link has already been used | 401         |
| `AUTH_MAGIC_LINK_NOT_FOUND`    | Magic link not found in system   | 404         |

---

### User Management (2000-2999)

| Error Code            | Description                       | HTTP Status |
| --------------------- | --------------------------------- | ----------- |
| `USER_NOT_FOUND`      | User account not found            | 404         |
| `USER_ALREADY_EXISTS` | User account already exists       | 409         |
| `USER_DELETED`        | User account has been deleted     | 410         |
| `USER_UPDATE_FAILED`  | Failed to update user information | 500         |
| `USER_DELETE_FAILED`  | Failed to delete user account     | 500         |

---

### Circles (3000-3999)

#### Circle Errors (3000-3099)

| Error Code               | Description                          | HTTP Status |
| ------------------------ | ------------------------------------ | ----------- |
| `CIRCLE_NOT_FOUND`       | Circle not found                     | 404         |
| `CIRCLE_ALREADY_EXISTS`  | Circle with this name already exists | 409         |
| `CIRCLE_CREATE_FAILED`   | Failed to create circle              | 500         |
| `CIRCLE_UPDATE_FAILED`   | Failed to update circle              | 500         |
| `CIRCLE_DELETE_FAILED`   | Failed to delete circle              | 500         |
| `CIRCLE_NAME_REQUIRED`   | Circle name is required              | 400         |
| `CIRCLE_INVALID_PRIVACY` | Invalid privacy setting              | 400         |

#### Circle Member Errors (3100-3199)

| Error Code                    | Description                               | HTTP Status |
| ----------------------------- | ----------------------------------------- | ----------- |
| `CIRCLE_NOT_MEMBER`           | User is not a member of this circle       | 403         |
| `CIRCLE_NOT_OWNER`            | Only circle owner can perform this action | 403         |
| `CIRCLE_ALREADY_MEMBER`       | User is already a member of this circle   | 409         |
| `CIRCLE_MEMBER_LIMIT_REACHED` | Maximum number of members reached         | 400         |
| `CIRCLE_CANNOT_REMOVE_OWNER`  | Cannot remove the circle owner            | 400         |
| `CIRCLE_MEMBER_ADD_FAILED`    | Failed to add member to circle            | 500         |
| `CIRCLE_MEMBER_REMOVE_FAILED` | Failed to remove member from circle       | 500         |

---

### Events (4000-4999)

#### Event Errors (4000-4099)

| Error Code             | Description             | HTTP Status |
| ---------------------- | ----------------------- | ----------- |
| `EVENT_NOT_FOUND`      | Event not found         | 404         |
| `EVENT_CREATE_FAILED`  | Failed to create event  | 500         |
| `EVENT_UPDATE_FAILED`  | Failed to update event  | 500         |
| `EVENT_DELETE_FAILED`  | Failed to delete event  | 500         |
| `EVENT_TITLE_REQUIRED` | Event title is required | 400         |
| `EVENT_INVALID_STATUS` | Invalid event status    | 400         |

#### Event Lock/Finalize (4100-4199)

| Error Code                      | Description                     | HTTP Status |
| ------------------------------- | ------------------------------- | ----------- |
| `EVENT_ALREADY_LOCKED`          | Event is already locked         | 400         |
| `EVENT_NOT_LOCKED`              | Event is not locked             | 400         |
| `EVENT_ALREADY_FINALIZED`       | Event is already finalized      | 400         |
| `EVENT_NOT_FINALIZED`           | Event is not finalized          | 400         |
| `EVENT_CANNOT_MODIFY_LOCKED`    | Cannot modify a locked event    | 403         |
| `EVENT_CANNOT_MODIFY_FINALIZED` | Cannot modify a finalized event | 403         |
| `EVENT_LOCK_FAILED`             | Failed to lock event            | 500         |
| `EVENT_FINALIZE_FAILED`         | Failed to finalize event        | 500         |

#### Event Time (4200-4299)

| Error Code                 | Description                        | HTTP Status |
| -------------------------- | ---------------------------------- | ----------- |
| `EVENT_TIME_NOT_FOUND`     | Event time slot not found          | 404         |
| `EVENT_TIME_REQUIRED`      | At least one time slot is required | 400         |
| `EVENT_TIME_INVALID`       | Invalid event time                 | 400         |
| `EVENT_TIME_CONFLICT`      | Time slot conflicts with another   | 409         |
| `EVENT_NO_TIMES_AVAILABLE` | No time slots available            | 400         |

#### RSVP (4300-4399)

| Error Code                  | Description           | HTTP Status |
| --------------------------- | --------------------- | ----------- |
| `EVENT_RSVP_NOT_FOUND`      | RSVP not found        | 404         |
| `EVENT_RSVP_UPDATE_FAILED`  | Failed to update RSVP | 500         |
| `EVENT_RSVP_INVALID_STATUS` | Invalid RSVP status   | 400         |
| `EVENT_RSVP_ALREADY_EXISTS` | RSVP already exists   | 409         |

#### Voting (4400-4499)

| Error Code                 | Description                   | HTTP Status |
| -------------------------- | ----------------------------- | ----------- |
| `EVENT_VOTE_NOT_FOUND`     | Vote not found                | 404         |
| `EVENT_VOTE_FAILED`        | Failed to record vote         | 500         |
| `EVENT_CANNOT_VOTE_LOCKED` | Cannot vote on a locked event | 403         |
| `EVENT_ALREADY_VOTED`      | User has already voted        | 409         |

---

### Validation Errors (5000-5999)

| Error Code                          | Description                   | HTTP Status |
| ----------------------------------- | ----------------------------- | ----------- |
| `VALIDATION_FAILED`                 | Input validation failed       | 400         |
| `VALIDATION_INVALID_INPUT`          | Invalid input provided        | 400         |
| `VALIDATION_REQUIRED_FIELD_MISSING` | A required field is missing   | 400         |
| `VALIDATION_INVALID_FORMAT`         | Invalid format                | 400         |
| `VALIDATION_INVALID_UUID`           | Invalid UUID format           | 400         |
| `VALIDATION_INVALID_DATE`           | Invalid date format           | 400         |
| `VALIDATION_INVALID_EMAIL`          | Invalid email format          | 400         |
| `VALIDATION_INVALID_URL`            | Invalid URL format            | 400         |
| `VALIDATION_VALUE_TOO_LONG`         | Value exceeds maximum length  | 400         |
| `VALIDATION_VALUE_TOO_SHORT`        | Value below minimum length    | 400         |
| `VALIDATION_VALUE_OUT_OF_RANGE`     | Value out of acceptable range | 400         |

---

### Database & System Errors (6000-6999)

| Error Code                  | Description                      | HTTP Status |
| --------------------------- | -------------------------------- | ----------- |
| `DB_ERROR`                  | Generic database error           | 500         |
| `DB_CONNECTION_FAILED`      | Failed to connect to database    | 503         |
| `DB_DUPLICATE_ENTRY`        | Duplicate entry in database      | 409         |
| `DB_FOREIGN_KEY_CONSTRAINT` | Foreign key constraint violation | 400         |
| `DB_TRANSACTION_FAILED`     | Database transaction failed      | 500         |
| `DB_QUERY_FAILED`           | Database query failed            | 500         |

---

### Generic Errors (7000-7999)

| Error Code              | Description                     | HTTP Status |
| ----------------------- | ------------------------------- | ----------- |
| `INTERNAL_SERVER_ERROR` | Internal server error           | 500         |
| `SERVICE_UNAVAILABLE`   | Service temporarily unavailable | 503         |
| `NOT_FOUND`             | Resource not found              | 404         |
| `NOT_IMPLEMENTED`       | Feature not yet implemented     | 501         |
| `RATE_LIMIT_EXCEEDED`   | Too many requests               | 429         |
| `REQUEST_TIMEOUT`       | Request timed out               | 408         |
| `PAYLOAD_TOO_LARGE`     | Request payload too large       | 413         |
| `UNKNOWN_ERROR`         | An unknown error occurred       | 500         |

---

### External Service Errors (8000-8999)

| Error Code              | Description           | HTTP Status |
| ----------------------- | --------------------- | ----------- |
| `EMAIL_SERVICE_ERROR`   | Email service error   | 500         |
| `EMAIL_SEND_FAILED`     | Failed to send email  | 500         |
| `STORAGE_SERVICE_ERROR` | Storage service error | 500         |
| `EXTERNAL_API_ERROR`    | External API error    | 502         |

---

## Usage in Flutter

### Recommended Translation Approach

Create a map of error codes to localized messages in your Flutter app:

```dart
class ErrorMessages {
  static final Map<String, String> en = {
    'AUTH_EMAIL_ALREADY_EXISTS': 'This email is already registered',
    'AUTH_INVALID_CREDENTIALS': 'Invalid email or password',
    'CIRCLE_NOT_FOUND': 'Circle not found',
    // ... add all error codes
  };

  static final Map<String, String> es = {
    'AUTH_EMAIL_ALREADY_EXISTS': 'Este correo ya está registrado',
    'AUTH_INVALID_CREDENTIALS': 'Email o contraseña inválidos',
    'CIRCLE_NOT_FOUND': 'Círculo no encontrado',
    // ... add all error codes
  };

  static String getMessage(String errorCode, String locale) {
    final messages = locale == 'es' ? es : en;
    return messages[errorCode] ?? 'An error occurred';
  }
}
```

### Example API Response Handling

```dart
try {
  final response = await apiClient.post('/api/auth/register', data);

  if (response.data['success']) {
    // Handle success
    final data = response.data['data'];
  } else {
    // Handle error with translation
    final errorCode = response.data['errorCode'];
    final localizedMessage = ErrorMessages.getMessage(
      errorCode,
      Localizations.localeOf(context).languageCode
    );

    // Show error to user
    showSnackBar(localizedMessage);

    // Optional: Log details for debugging
    print('Error details: ${response.data['details']}');
  }
} catch (e) {
  // Handle network errors
}
```

---

## Notes

1. **Always check `success` field first** to determine if the request succeeded
2. **Use `errorCode` for translation**, not the `message` field
3. **`message` field** provides English fallback and is useful for debugging
4. **`details` field** contains additional debugging information (always included for transparency)
5. **`timestamp` field** shows when the error occurred (useful for logging)

## Version

**Document Version:** 1.0.0  
**API Version:** 1.0  
**Last Updated:** November 19, 2025
