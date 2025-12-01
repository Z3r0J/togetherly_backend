import {
  ICircleRepository,
  ICircleMemberRepository,
} from "@domain/ports/circle.repository.js";
import {
  IEventRepository,
  IEventRsvpRepository,
  IEventTimeRepository,
} from "@domain/ports/event.repository.js";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";

export type GetCircleDetailInput = {
  circleId: string;
  userId: string;
};

export type CircleMemberDetail = {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
  joinedAt: Date;
};

export type GetCircleDetailResult = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  privacy: string;
  ownerId: string;
  shareToken?: string;
  members: CircleMemberDetail[];
  events?: CircleEventSummary[];
  userRole: string;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GetCircleDetailDependencies = {
  circleRepo: ICircleRepository;
  circleMemberRepo: ICircleMemberRepository;
  eventRepo: IEventRepository;
  eventRsvpRepo: IEventRsvpRepository;
  eventTimeRepo: IEventTimeRepository;
};

export type CircleEventSummary = {
  id: string;
  circleId: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  } | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  allDay: boolean;
  color?: string | null;
  status: string;
  reminderMinutes?: number | null;
  rsvpStatus?: string | null;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  eventTimes?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
  }>;
};

/**
 * Get Circle Detail Use Case
 * Returns circle details with members list
 */
export class GetCircleDetailUseCase {
  constructor(private deps: GetCircleDetailDependencies) {}

  async execute(
    input: GetCircleDetailInput
  ): Promise<Result<GetCircleDetailResult>> {
    const { circleId, userId } = input;

    // Get circle
    const circleResult = await this.deps.circleRepo.findByIdWithMembers(
      circleId
    );

    if (!circleResult.ok) {
      return Result.fail(
        circleResult.error,
        500,
        circleResult.errorCode || ErrorCode.DATABASE_ERROR,
        circleResult.details
      );
    }

    if (!circleResult.data) {
      return Result.fail("Circle not found", 404, ErrorCode.CIRCLE_NOT_FOUND);
    }

    const circle = circleResult.data;

    // Get user's role
    const roleResult = await this.deps.circleMemberRepo.getUserRole(
      circleId,
      userId
    );

    if (!roleResult.ok || !roleResult.data) {
      return Result.fail(
        "You are not a member of this circle",
        403,
        ErrorCode.NOT_CIRCLE_MEMBER
      );
    }

    const userRole = roleResult.data;

    // Get all members
    const membersResult = await this.deps.circleMemberRepo.listCircleMembers(
      circleId
    );

    if (!membersResult.ok) {
      return Result.fail(
        membersResult.error,
        500,
        membersResult.errorCode || ErrorCode.DATABASE_ERROR,
        membersResult.details
      );
    }

    const members: CircleMemberDetail[] = membersResult.data!.map((member) => ({
      id: member.id!,
      userId: member.userId,
      role: member.role,
      name: member.user?.name || "Unknown",
      email: member.user?.email || "",
      joinedAt: member.createdAt!,
    }));

    // Load circle events with RSVP counts and time options
    const eventsResult = await this.deps.eventRepo.findByCircleId(circleId);
    if (!eventsResult.ok) {
      return Result.fail(
        eventsResult.error!,
        eventsResult.status!,
        eventsResult.errorCode || ErrorCode.DATABASE_ERROR,
        eventsResult.details
      );
    }

    const events: CircleEventSummary[] = [];

    if (eventsResult.data) {
      for (const event of eventsResult.data) {
        // Fetch RSVP counts
        const [going, maybe, notGoing] = await Promise.all([
          this.deps.eventRsvpRepo.countByStatus(event.id!, "going"),
          this.deps.eventRsvpRepo.countByStatus(event.id!, "maybe"),
          this.deps.eventRsvpRepo.countByStatus(event.id!, "not going"),
        ]);

        // User RSVP (if any)
        const userRsvpResult = await this.deps.eventRsvpRepo.findByEventAndUser(
          event.id!,
          userId
        );

        // Time options (for polls)
        const eventTimesResult = await this.deps.eventTimeRepo.findByEventId(
          event.id!
        );

        events.push({
          id: event.id!,
          circleId: event.circleId!,
          title: event.title,
          description: event.description,
          notes: event.notes,
          location: event.location as any,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          allDay: event.allDay || false,
          color: event.color,
          status: event.status || "draft",
          reminderMinutes: event.reminderMinutes,
          rsvpStatus: userRsvpResult.ok
            ? userRsvpResult.data?.status || null
            : null,
          goingCount: going.ok ? going.data || 0 : 0,
          maybeCount: maybe.ok ? maybe.data || 0 : 0,
          notGoingCount: notGoing.ok ? notGoing.data || 0 : 0,
          eventTimes: eventTimesResult.ok
            ? (eventTimesResult.data || []).map((et) => ({
                id: et.id!,
                startTime: et.startTime!,
                endTime: et.endTime!,
              }))
            : [],
        });
      }

      // Sort events by start time (fallback to createdAt)
      events.sort((a, b) => {
        const aDate =
          a.startsAt?.getTime() ?? a.eventTimes?.[0]?.startTime?.getTime() ?? 0;
        const bDate =
          b.startsAt?.getTime() ?? b.eventTimes?.[0]?.startTime?.getTime() ?? 0;
        return aDate - bDate;
      });
    }

    const result: GetCircleDetailResult = {
      id: circle.id!,
      name: circle.name,
      description: circle.description,
      color: circle.color,
      privacy: circle.privacy!,
      ownerId: circle.ownerId,
      shareToken: circle.shareToken,
      members,
      events,
      userRole,
      canEdit: userRole === "owner" || userRole === "admin",
      canDelete: userRole === "owner",
      createdAt: circle.createdAt!,
      updatedAt: circle.updatedAt!,
    };

    return Result.ok(result, 200);
  }
}
