import { Circle } from "@domain/entities/circles/circle.entity.js";
import { CircleMember } from "@domain/entities/circles/circle-members.entity.js";
import { CircleInvitation } from "@domain/entities/circles/circle-invitation.entity.js";
import { Result } from "@shared/types/index.js";

/**
 * Circle Repository Interface
 */
export interface ICircleRepository {
  create(circle: Circle): Promise<Result<Circle>>;
  findById(id: string): Promise<Result<Circle | null>>;
  findByIdWithMembers(id: string): Promise<Result<Circle | null>>;
  findByShareToken(shareToken: string): Promise<Result<Circle | null>>;
  update(id: string, updates: Partial<Circle>): Promise<Result<Circle | null>>;
  softDelete(id: string): Promise<Result<void>>;
  listMyCircles(
    userId: string
  ): Promise<Result<Array<Circle & { memberCount?: number; role?: string }>>>;
}

/**
 * Circle Member Repository Interface
 */
export interface ICircleMemberRepository {
  addMember(member: CircleMember): Promise<Result<CircleMember>>;
  findMember(
    circleId: string,
    userId: string
  ): Promise<Result<CircleMember | null>>;
  listCircleMembers(circleId: string): Promise<Result<CircleMember[]>>;
  updateMemberRole(
    circleId: string,
    userId: string,
    role: string
  ): Promise<Result<void>>;
  removeMember(circleId: string, userId: string): Promise<Result<void>>;
  getUserRole(circleId: string, userId: string): Promise<Result<string | null>>;
}

/**
 * Circle Invitation Repository Interface
 */
export interface ICircleInvitationRepository {
  create(invitation: CircleInvitation): Promise<Result<CircleInvitation>>;
  findByToken(token: string): Promise<Result<CircleInvitation | null>>;
  findByCircleAndEmail(
    circleId: string,
    email: string
  ): Promise<Result<CircleInvitation | null>>;
  updateStatus(
    id: string,
    status: string,
    acceptedAt?: Date
  ): Promise<Result<void>>;
  listPendingInvitations(circleId: string): Promise<Result<CircleInvitation[]>>;
  countPendingInvitations(circleId: string): Promise<Result<number>>;
  softDelete(id: string): Promise<Result<void>>;
}
