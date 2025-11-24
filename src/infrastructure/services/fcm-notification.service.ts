import * as admin from "firebase-admin";
import { INotificationService } from "@domain/ports/notification.repository.js";
import { IDeviceTokenRepository } from "@domain/ports/notification.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";
import { Result } from "@shared/types/Result.js";
import { ErrorCode } from "@shared/errors/error-codes.js";

export type FcmConfig = {
  serviceAccountPath?: string;
  serviceAccountJson?: string; // JSON string of service account
};

/**
 * Firebase Cloud Messaging Notification Service
 * Handles push notifications to iOS and Android devices
 */
export class FcmNotificationService implements INotificationService {
  private app: admin.app.App | null = null;

  constructor(
    private config: FcmConfig,
    private deviceTokenRepository: IDeviceTokenRepository,
    private logger: ILogger
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      // Check if already initialized
      if (admin.apps.length > 0) {
        this.app = admin.apps[0];
        this.logger.info("Firebase Admin already initialized");
        return;
      }

      // Initialize with service account
      if (this.config.serviceAccountPath) {
        const serviceAccount = require(this.config.serviceAccountPath);
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else if (this.config.serviceAccountJson) {
        const serviceAccount = JSON.parse(this.config.serviceAccountJson);
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        this.logger.warn(
          "Firebase not configured - push notifications will be disabled"
        );
        return;
      }

      this.logger.info("Firebase Admin SDK initialized successfully");
    } catch (error) {
      this.logger.error(
        "Failed to initialize Firebase Admin SDK",
        error as Error
      );
      this.app = null;
    }
  }

  async sendPush(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      priority?: "normal" | "high";
    }
  ): Promise<Result<{ successCount: number; failureCount: number }>> {
    // Check if Firebase is initialized
    if (!this.app) {
      this.logger.warn("Firebase not initialized - skipping push notification");
      return Result.ok({ successCount: 0, failureCount: 0 });
    }

    // Get user's device tokens
    const tokensResult = await this.deviceTokenRepository.findByUserId(userId);
    if (
      !tokensResult.ok ||
      !tokensResult.data ||
      tokensResult.data.length === 0
    ) {
      this.logger.info(`No device tokens found for user ${userId}`);
      return Result.ok({ successCount: 0, failureCount: 0 });
    }

    const tokens = tokensResult.data.map((dt) => dt.token);
    return this.sendMulticast(tokens, notification);
  }

  async sendMulticast(
    tokens: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      priority?: "normal" | "high";
    }
  ): Promise<
    Result<{
      successCount: number;
      failureCount: number;
      invalidTokens: string[];
    }>
  > {
    if (!this.app) {
      return Result.ok({
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      });
    }

    if (tokens.length === 0) {
      return Result.ok({
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      });
    }

    try {
      const messaging = admin.messaging(this.app);

      // Build the message
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        tokens: tokens,
        android: {
          priority: notification.priority === "high" ? "high" : "normal",
          notification: {
            sound: "default",
            channelId: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      // Send the multicast message
      const response = await messaging.sendEachForMulticast(message);

      this.logger.info(
        `Successfully sent ${response.successCount} of ${tokens.length} notifications`,
        {
          successCount: response.successCount,
          failureCount: response.failureCount,
        }
      );

      // Handle failures and invalid tokens
      const invalidTokens: string[] = [];
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            const error = resp.error;
            this.logger.warn(`Failed to send to token ${tokens[idx]}`, {
              error: error?.message,
              code: error?.code,
            });

            // Deactivate invalid tokens
            if (
              error?.code === "messaging/invalid-registration-token" ||
              error?.code === "messaging/registration-token-not-registered"
            ) {
              invalidTokens.push(tokens[idx]);
              this.deviceTokenRepository
                .deactivateByToken(tokens[idx])
                .catch((err) => {
                  this.logger.error("Failed to deactivate token", err as Error);
                });
            }
          }
        });
      }

      return Result.ok({
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      });
    } catch (error) {
      this.logger.error(
        "Failed to send multicast notification",
        error as Error
      );
      return Result.fail(
        error instanceof Error
          ? error.message
          : "Unknown error sending push notification",
        500,
        ErrorCode.EXTERNAL_API_ERROR,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Send a notification to a specific device token (for testing)
   */
  async sendToToken(
    token: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    }
  ): Promise<Result<string>> {
    if (!this.app) {
      return Result.fail(
        "Firebase not initialized",
        500,
        ErrorCode.SERVICE_UNAVAILABLE
      );
    }

    try {
      const messaging = admin.messaging(this.app);

      const message: admin.messaging.Message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        token: token,
      };

      const messageId = await messaging.send(message);
      this.logger.info(`Successfully sent notification to token`, {
        messageId,
      });
      return Result.ok(messageId);
    } catch (error) {
      this.logger.error("Failed to send notification to token", error as Error);
      return Result.fail(
        error instanceof Error
          ? error.message
          : "Unknown error sending push notification",
        500,
        ErrorCode.EXTERNAL_API_ERROR,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }
}
