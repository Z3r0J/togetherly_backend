import {
  ICircleInvitationRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import { Result } from "@shared/types/index.js";
import { CircleMember } from "@domain/entities/circles/circle-members.entity.js";

export type ClaimPendingInvitationsInput = {
  userId: string;
  email: string;
};

export type ClaimPendingInvitationsResult = {
  claimed: number;
  totalPending: number;
  skippedAlreadyMember: number;
};

export type ClaimPendingInvitationsDeps = {
  invitationRepo: ICircleInvitationRepository;
  circleMemberRepo: ICircleMemberRepository;
};

/**
 * Claim all pending circle invitations that match the user's email.
 * If the user is already a member, mark the invitation as accepted but
 * do not create a duplicate membership.
 */
export class ClaimPendingInvitationsUseCase {
  constructor(private deps: ClaimPendingInvitationsDeps) {}

  async execute(
    input: ClaimPendingInvitationsInput
  ): Promise<Result<ClaimPendingInvitationsResult>> {
    const { userId, email } = input;

    try {
      const pendingRes = await this.deps.invitationRepo.findPendingByEmail(
        email
      );

      if (!pendingRes.ok || !pendingRes.data) {
        return Result.fail(
          "Failed to find pending invitations",
          pendingRes.status || 500
        );
      }

      const invitations = pendingRes.data;
      let claimed = 0;
      let skippedAlreadyMember = 0;

      for (const inv of invitations) {
        // Double-check status
        if (inv.status !== "pending") continue;

        const memberRes = await this.deps.circleMemberRepo.findMember(
          inv.circleId,
          userId
        );

        if (memberRes.ok && memberRes.data) {
          skippedAlreadyMember += 1;
          await this.deps.invitationRepo.updateStatus(
            inv.id!,
            "accepted",
            new Date()
          );
          continue;
        }

        const member: CircleMember = {
          circleId: inv.circleId,
          userId,
          role: "member",
        };

        const addRes = await this.deps.circleMemberRepo.addMember(member);
        if (!addRes.ok) {
          // Skip failures but continue with others
          continue;
        }

        await this.deps.invitationRepo.updateStatus(
          inv.id!,
          "accepted",
          new Date()
        );
        claimed += 1;
      }

      return Result.ok({
        claimed,
        totalPending: invitations.length,
        skippedAlreadyMember,
      });
    } catch (error) {
      return Result.fail(
        "Failed to claim invitations",
        500,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
