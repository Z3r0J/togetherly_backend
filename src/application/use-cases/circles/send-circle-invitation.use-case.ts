import {
  ICircleRepository,
  ICircleMemberRepository,
  ICircleInvitationRepository,
} from "@domain/ports/circle.repository.js";
import { IUserRepository } from "@domain/ports/account.repository.js";
import { IMailerService } from "@domain/ports/mailer.port.js";
import {
  INotificationRepository,
  IOutboxRepository,
} from "@domain/ports/notification.repository.js";
import { NotificationTemplateService } from "@app/services/notification-template.service.js";
import { createOutboxEvent } from "@domain/entities/notifications/outbox-event.entity.js";
import { CircleInvitation } from "@domain/entities/circles/circle-invitation.entity.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { randomBytes } from "crypto";

export type SendCircleInvitationInput = {
  circleId: string;
  invitedEmails: string[]; // Array of emails to invite
  invitedBy: string; // userId of the inviter
  type?: "email" | "link"; // email sent or link-only
};

export type SendCircleInvitationResult = {
  success: string[]; // Successfully sent invitations
  failed: Array<{ email: string; reason: string }>; // Failed invitations
};

export type SendCircleInvitationDependencies = {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
  invitationRepo: ICircleInvitationRepository;
  userRepo: IUserRepository;
  mailerService: IMailerService;
  notificationRepo: INotificationRepository;
  outboxRepo: IOutboxRepository;
  notificationTemplateService: NotificationTemplateService;
};

/**
 * Send Circle Invitation Use Case
 * Generates invitation tokens and sends emails to invited users
 */
export class SendCircleInvitationUseCase {
  constructor(private deps: SendCircleInvitationDependencies) {}

  async execute(
    input: SendCircleInvitationInput
  ): Promise<Result<SendCircleInvitationResult>> {
    const { circleId, invitedEmails, invitedBy, type = "email" } = input;

    // Validate max emails per request (10)
    if (invitedEmails.length > 10) {
      return Result.fail(
        "Maximum 10 emails allowed per request",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Check if circle exists
    const circleResult = await this.deps.circleRepo.findById(circleId);
    if (!circleResult.ok || !circleResult.data) {
      return Result.fail("Circle not found", 404, ErrorCode.CIRCLE_NOT_FOUND);
    }

    const circle = circleResult.data;

    // Check if inviter is owner or admin
    const roleResult = await this.deps.circleMemberRepo.getUserRole(
      circleId,
      invitedBy
    );

    if (!roleResult.ok || !roleResult.data) {
      return Result.fail(
        "You are not a member of this circle",
        403,
        ErrorCode.NOT_CIRCLE_MEMBER
      );
    }

    const role = roleResult.data;
    if (role !== "owner" && role !== "admin") {
      return Result.fail(
        "Only circle owners and admins can send invitations",
        403,
        ErrorCode.NOT_CIRCLE_OWNER
      );
    }

    // Check pending invitation limit (50 per circle)
    const countResult = await this.deps.invitationRepo.countPendingInvitations(
      circleId
    );
    if (!countResult.ok) {
      return Result.fail(
        countResult.error,
        500,
        countResult.errorCode || ErrorCode.DATABASE_ERROR
      );
    }

    if (countResult.data! + invitedEmails.length > 50) {
      return Result.fail(
        "Maximum 50 pending invitations per circle",
        400,
        ErrorCode.INVITATION_LIMIT_REACHED
      );
    }

    // Get inviter details
    const inviterResult = await this.deps.userRepo.findById(invitedBy);
    if (!inviterResult.ok || !inviterResult.data) {
      return Result.fail("Inviter not found", 404, ErrorCode.USER_NOT_FOUND);
    }
    const inviterName = inviterResult.data.name || "Someone";

    const success: string[] = [];
    const failed: Array<{ email: string; reason: string }> = [];

    // Process each email
    for (const email of invitedEmails) {
      try {
        // Check if user is already a member
        const userResult = await this.deps.userRepo.findByEmail(email);
        if (userResult.ok && userResult.data) {
          const memberResult = await this.deps.circleMemberRepo.findMember(
            circleId,
            userResult.data.id!
          );
          if (memberResult.ok && memberResult.data) {
            failed.push({
              email,
              reason: "User is already a member of this circle",
            });
            continue;
          }
        }

        // Check if there's already a pending invitation
        const existingResult =
          await this.deps.invitationRepo.findByCircleAndEmail(circleId, email);
        if (existingResult.ok && existingResult.data) {
          failed.push({
            email,
            reason: "An invitation has already been sent to this email",
          });
          continue;
        }

        // Generate unique token
        const token = randomBytes(32).toString("hex");

        // Create invitation
        const invitation: CircleInvitation = {
          circleId,
          invitedEmail: email,
          invitedBy,
          token,
          type,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        const createResult = await this.deps.invitationRepo.create(invitation);
        if (!createResult.ok) {
          failed.push({ email, reason: "Failed to create invitation" });
          continue;
        }

        // Send email if type is email
        if (type === "email") {
          const isRegistered = userResult.ok && userResult.data !== null;

          // Create outbox event for async email sending
          const emailEvent = createOutboxEvent({
            aggregateType: "circle",
            aggregateId: circleId,
            eventType: "email.invitation",
            maxRetries: 3,
            payload: {
              inviterName,
              circleName: circle.name,
              email,
              token,
              isRegistered,
            },
          });

          await this.deps.outboxRepo.create(emailEvent);
        }

        // Create in-app notification if user exists
        if (userResult.ok && userResult.data) {
          try {
            const notification =
              this.deps.notificationTemplateService.createCircleInvitation(
                userResult.data.id!,
                { name: inviterName },
                circle
              );

            const notificationResult = await this.deps.notificationRepo.create(
              notification
            );

            if (notificationResult.ok) {
              // Create outbox event for immediate push
              const pushEvent = createOutboxEvent({
                aggregateType: "circle",
                aggregateId: circleId,
                eventType: "notification.push",
                maxRetries: 3,
                payload: {
                  notificationId: notificationResult.data.id!,
                  userId: userResult.data.id!,
                },
              });

              await this.deps.outboxRepo.create(pushEvent);
            }
          } catch (error) {
            // Silently fail notification, don't block invitation
            console.error("Error creating in-app notification:", error);
          }
        }

        success.push(email);
      } catch (error) {
        failed.push({
          email,
          reason:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    return Result.ok({ success, failed }, 200);
  }
}
