import {
  ICircleInvitationRepository,
  ICircleMemberRepository,
  ICircleRepository,
} from "@domain/ports/circle.repository.js";
import { IUserRepository } from "@domain/ports/account.repository.js";
import {
  INotificationRepository,
  IOutboxRepository,
} from "@domain/ports/notification.repository.js";
import { NotificationTemplateService } from "@app/services/notification-template.service.js";
import { createOutboxEvent } from "@domain/entities/notifications/outbox-event.entity.js";
import { CircleMember } from "@domain/entities/circles/circle-members.entity.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";

export type AcceptCircleInvitationInput = {
  token: string;
  userId: string;
  userEmail?: string;
};

export type AcceptCircleInvitationResult = {
  circleId: string;
  circleName: string;
  message: string;
};

export type AcceptCircleInvitationDependencies = {
  invitationRepo: ICircleInvitationRepository;
  circleMemberRepo: ICircleMemberRepository;
  circleRepo: ICircleRepository;
  userRepo: IUserRepository;
  notificationRepo: INotificationRepository;
  outboxRepo: IOutboxRepository;
  notificationTemplateService: NotificationTemplateService;
};

/**
 * Accept Circle Invitation Use Case
 * Validates token, checks email match, adds user to circle
 */
export class AcceptCircleInvitationUseCase {
  constructor(private deps: AcceptCircleInvitationDependencies) {}

  async execute(
    input: AcceptCircleInvitationInput
  ): Promise<Result<AcceptCircleInvitationResult>> {
    const { token, userId } = input;

    // Find invitation by token
    const invitationResult = await this.deps.invitationRepo.findByToken(token);

    if (!invitationResult.ok) {
      return Result.fail(
        invitationResult.error,
        500,
        invitationResult.errorCode || ErrorCode.DATABASE_ERROR
      );
    }

    if (!invitationResult.data) {
      return Result.fail(
        "Invitation not found",
        404,
        ErrorCode.INVITATION_NOT_FOUND
      );
    }

    const invitation = invitationResult.data;

    // Check if invitation is expired
    const isExpired = new Date() > new Date(invitation.expiresAt);
    if (isExpired || invitation.status === "expired") {
      return Result.fail(
        "Invitation has expired",
        400,
        ErrorCode.INVITATION_EXPIRED
      );
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return Result.fail(
        "Invitation has already been accepted",
        400,
        ErrorCode.INVITATION_ALREADY_ACCEPTED
      );
    }

    // Check if already declined
    if (invitation.status === "declined") {
      return Result.fail(
        "Invitation has been declined",
        400,
        ErrorCode.INVITATION_ALREADY_DECLINED
      );
    }

    // Resolve user email - prefer token claim, fallback to DB lookup
    let userEmail = input.userEmail;

    if (!userEmail) {
      const userResult = await this.deps.userRepo.findById(userId);

      if (!userResult.ok) {
        return Result.fail(
          userResult.error,
          userResult.status,
          userResult.errorCode || ErrorCode.DATABASE_ERROR
        );
      }

      if (!userResult.data || !userResult.data.email) {
        return Result.fail(
          "User not found",
          404,
          ErrorCode.USER_NOT_FOUND
        );
      }

      userEmail = userResult.data.email;
    }

    // Verify email matches
    if (invitation.invitedEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return Result.fail(
        "Invitation email does not match your account email",
        403,
        ErrorCode.INVITATION_EMAIL_MISMATCH
      );
    }

    // Check if user is already a member
    const memberResult = await this.deps.circleMemberRepo.findMember(
      invitation.circleId,
      userId
    );

    if (memberResult.ok && memberResult.data) {
      // Update invitation status anyway
      await this.deps.invitationRepo.updateStatus(
        invitation.id!,
        "accepted",
        new Date()
      );
      return Result.fail(
        "You are already a member of this circle",
        400,
        ErrorCode.ALREADY_CIRCLE_MEMBER
      );
    }

    // Add user as member
    const member: CircleMember = {
      circleId: invitation.circleId,
      userId,
      role: "member",
    };

    const addMemberResult = await this.deps.circleMemberRepo.addMember(member);

    if (!addMemberResult.ok) {
      return Result.fail(
        addMemberResult.error,
        500,
        addMemberResult.errorCode || ErrorCode.MEMBER_ADD_FAILED
      );
    }

    // Update invitation status to accepted
    await this.deps.invitationRepo.updateStatus(
      invitation.id!,
      "accepted",
      new Date()
    );

    // Notify circle owner about new member
    await this.notifyCircleOwner(invitation.circleId, userId);

    const result: AcceptCircleInvitationResult = {
      circleId: invitation.circleId,
      circleName: invitation.circle?.name || "Circle",
      message: "Successfully joined the circle",
    };

    return Result.ok(result, 200);
  }

  /**
   * Notify circle owner when new member joins
   */
  private async notifyCircleOwner(
    circleId: string,
    newMemberId: string
  ): Promise<void> {
    try {
      // Get circle details
      const circleResult = await this.deps.circleRepo.findById(circleId);
      if (!circleResult.ok || !circleResult.data) {
        return; // Silently fail
      }

      const circle = circleResult.data;

      // Get new member name
      const memberResult = await this.deps.userRepo.findById(newMemberId);
      if (!memberResult.ok || !memberResult.data) {
        return; // Silently fail
      }

      const member = memberResult.data;

      // Create notification for circle owner
      const notification =
        this.deps.notificationTemplateService.createMemberJoined(
          circle.ownerId,
          member,
          circle
        );

      const notificationResult = await this.deps.notificationRepo.create(
        notification
      );

      if (!notificationResult.ok) {
        return; // Silently fail
      }

      // Create outbox event for immediate push
      const pushEvent = createOutboxEvent({
        aggregateType: "circle",
        aggregateId: circleId,
        eventType: "notification.push",
        maxRetries: 3,
        payload: {
          notificationId: notificationResult.data.id!,
          userId: circle.ownerId,
        },
      });

      await this.deps.outboxRepo.create(pushEvent);
    } catch (error) {
      // Silently fail to not block member addition
      console.error("Error notifying circle owner:", error);
    }
  }
}
