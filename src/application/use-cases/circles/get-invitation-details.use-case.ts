import {
  ICircleInvitationRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { IUserRepository } from "@domain/ports/account.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";

export type GetInvitationDetailsInput = {
  token: string;
};

export type GetInvitationDetailsResult = {
  invitationId: string;
  circleName: string;
  circleDescription?: string;
  circleColor?: string;
  inviterName: string;
  invitedEmail: string;
  expiresAt: Date;
  status: string;
  memberCount: number;
  isExpired: boolean;
  isRegistered: boolean;
};

export type GetInvitationDetailsDependencies = {
  invitationRepo: ICircleInvitationRepository;
  circleMemberRepo: ICircleMemberRepository;
  userRepo: IUserRepository;
};

/**
 * Get Invitation Details Use Case
 * Retrieves invitation and circle information by token (public, no auth required)
 */
export class GetInvitationDetailsUseCase {
  constructor(private deps: GetInvitationDetailsDependencies) {}

  async execute(
    input: GetInvitationDetailsInput
  ): Promise<Result<GetInvitationDetailsResult>> {
    const { token } = input;

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

    // Check if expired
    const isExpired = new Date() > new Date(invitation.expiresAt);

    // If expired and status is still pending, update status
    if (isExpired && invitation.status === "pending") {
      await this.deps.invitationRepo.updateStatus(invitation.id!, "expired");
    }

    // Get member count
    const membersResult = await this.deps.circleMemberRepo.listCircleMembers(
      invitation.circleId
    );
    const memberCount = membersResult.ok ? membersResult.data!.length : 0;

    // Check if the invited email is already registered
    const isRegisteredResult = await this.deps.userRepo.existsByEmail(
      invitation.invitedEmail
    );
    const isRegistered = isRegisteredResult.ok
      ? isRegisteredResult.data!
      : false;

    const result: GetInvitationDetailsResult = {
      invitationId: invitation.id!,
      circleName: invitation.circle?.name || "Circle",
      circleDescription: invitation.circle?.description,
      circleColor: invitation.circle?.color,
      inviterName: invitation.inviter?.name || "Someone",
      invitedEmail: invitation.invitedEmail,
      expiresAt: invitation.expiresAt,
      status: isExpired ? "expired" : invitation.status,
      memberCount,
      isExpired,
      isRegistered,
    };

    return Result.ok(result, 200);
  }
}
