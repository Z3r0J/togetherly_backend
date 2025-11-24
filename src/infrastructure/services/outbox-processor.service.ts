import { IOutboxRepository } from "@domain/ports/notification.repository.js";
import { INotificationRepository } from "@domain/ports/notification.repository.js";
import { INotificationService } from "@domain/ports/notification.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";
import { OutboxEvent } from "@domain/entities/notifications/outbox-event.entity.js";

export type OutboxProcessorConfig = {
  pollingIntervalMs: number; // How often to check for pending events (default 5000ms)
  maxRetries: number; // Maximum retry attempts (default 3)
  batchSize: number; // How many events to process per batch (default 10)
};

/**
 * Outbox Processor Service
 * Polls for pending outbox events and processes them asynchronously
 * Handles retries with exponential backoff
 */
export class OutboxProcessorService {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private outboxRepository: IOutboxRepository,
    private notificationRepository: INotificationRepository,
    private notificationService: INotificationService,
    private logger: ILogger,
    private config: OutboxProcessorConfig = {
      pollingIntervalMs: 5000,
      maxRetries: 3,
      batchSize: 10,
    }
  ) {}

  /**
   * Start processing outbox events
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn("Outbox processor already running");
      return;
    }

    this.isRunning = true;
    this.logger.info("Starting outbox processor", {
      pollingInterval: this.config.pollingIntervalMs,
      maxRetries: this.config.maxRetries,
      batchSize: this.config.batchSize,
    });

    // Start the polling loop
    this.scheduleNextPoll();
  }

  /**
   * Stop processing outbox events
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.logger.info("Stopped outbox processor");
  }

  /**
   * Schedule the next polling cycle
   */
  private scheduleNextPoll(): void {
    if (!this.isRunning) {
      return;
    }

    this.timer = setTimeout(async () => {
      await this.processOutboxEvents();
      this.scheduleNextPoll();
    }, this.config.pollingIntervalMs);
  }

  /**
   * Process pending and scheduled outbox events
   */
  private async processOutboxEvents(): Promise<void> {
    try {
      // Get pending events (including scheduled ones that are due)
      const pendingResult = await this.outboxRepository.findPending(
        this.config.batchSize
      );

      if (!pendingResult.ok || !pendingResult.data) {
        return;
      }

      const events = pendingResult.data;
      if (events.length === 0) {
        return;
      }

      this.logger.info(`Processing ${events.length} outbox events`);

      // Process each event
      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.logger.error("Error processing outbox events", error as Error);
    }
  }

  /**
   * Process a single outbox event
   */
  private async processEvent(event: OutboxEvent): Promise<void> {
    if (!event.id) {
      this.logger.error("Event missing ID, skipping");
      return;
    }

    // Mark as processing
    const markResult = await this.outboxRepository.markProcessing(event.id);
    if (!markResult.ok) {
      this.logger.error(`Failed to mark event ${event.id} as processing`);
      return;
    }

    try {
      // Process based on event type
      switch (event.eventType) {
        case "notification.push":
          await this.handleNotificationPush(event);
          break;

        case "notification.reminder":
          await this.handleNotificationReminder(event);
          break;

        case "notification.email":
        case "email.invitation":
        case "email.magic_link":
        case "rsvp.auto_create":
          // These event types are handled by other processors
          this.logger.info(`Skipping event type ${event.eventType}`);
          break;

        default:
          this.logger.warn(`Unknown event type: ${event.eventType}`, {
            eventId: event.id,
          });
          await this.outboxRepository.markFailed(
            event.id,
            `Unknown event type: ${event.eventType}`
          );
          return;
      }

      // Mark as completed
      await this.outboxRepository.markCompleted(event.id);
      this.logger.info(`Successfully processed event ${event.id}`, {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to process event ${event.id}`, error as Error);

      // Check if we should retry
      if (event.retryCount < this.config.maxRetries) {
        await this.outboxRepository.incrementRetry(event.id);
        this.logger.info(`Event ${event.id} will be retried`, {
          retryCount: event.retryCount + 1,
          maxRetries: this.config.maxRetries,
        });
      } else {
        await this.outboxRepository.markFailed(event.id, errorMessage);
        this.logger.error(
          `Event ${event.id} failed after max retries (${event.retryCount} attempts): ${errorMessage}`
        );
      }
    }
  }

  /**
   * Handle notification push event
   * Payload: { notificationId: string, userId: string }
   */
  private async handleNotificationPush(event: OutboxEvent): Promise<void> {
    const { notificationId, userId } = event.payload as {
      notificationId: string;
      userId: string;
    };

    // Get the notification from database
    const notifResult = await this.notificationRepository.findById(
      notificationId
    );
    if (!notifResult.ok || !notifResult.data) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const notification = notifResult.data;

    if (!notification.id) {
      throw new Error(`Notification missing ID`);
    }

    // Send push notification
    const pushResult = await this.notificationService.sendPush(userId, {
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification.id,
        type: notification.type,
        category: notification.category,
        ...(notification.metadata.eventId && {
          eventId: notification.metadata.eventId,
        }),
        ...(notification.metadata.circleId && {
          circleId: notification.metadata.circleId,
        }),
      },
      priority: notification.priority === "high" ? "high" : "normal",
    });

    if (!pushResult.ok) {
      throw new Error(`Failed to send push: ${pushResult.error}`);
    }

    this.logger.info(`Sent push notification for ${notification.id}`, {
      userId,
      successCount: pushResult.data?.successCount || 0,
    });
  }

  /**
   * Handle notification reminder event (scheduled)
   * Payload: { notificationId: string, userId: string }
   */
  private async handleNotificationReminder(event: OutboxEvent): Promise<void> {
    // Same as push for now - could add reminder-specific logic
    await this.handleNotificationPush(event);
  }

  /**
   * Get processor status
   */
  getStatus(): { isRunning: boolean; config: OutboxProcessorConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}
