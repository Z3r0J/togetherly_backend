import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { ICircleRepository } from "@domain/ports/circle.repository.js";
import {
  IEventRepository,
  IEventRsvpRepository,
} from "@domain/ports/event.repository.js";
import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";
import { Event } from "@domain/entities/events/event.entity.js";
import { EventRsvp } from "@domain/entities/events/event-rsvps.entity.js";

/**
 * List Unified Calendar Use Case
 * Returns all events (personal + circle events with RSVP status) in a unified view
 */

export interface ListUnifiedCalendarInput {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  filter?: "all" | "personal" | "going" | "maybe" | "not-going";
}

export interface UnifiedEventConflict {
  id: string;
  title: string;
  type: "personal" | "circle";
  startTime: Date;
  endTime: Date;
}

export interface UnifiedPersonalEvent {
  id: string;
  type: "personal";
  title: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  color?: string;
  notes?: string;
  reminderMinutes?: number;
  cancelled?: boolean;
  conflictsWith: UnifiedEventConflict[];
}

export interface UnifiedCircleEvent {
  id: string;
  type: "circle";
  title: string;
  circleId: string;
  circleName: string;
  circleColor?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  status: "draft" | "locked" | "finalized";
  rsvpStatus: "going" | "not going" | "maybe" | null;
  attendeeCount: number;
  hasConflict: boolean;
  conflictsWith: UnifiedEventConflict[];
  canChangeRsvp: boolean;
  isCreator: boolean;
}

export type UnifiedEvent = UnifiedPersonalEvent | UnifiedCircleEvent;

export interface UnifiedCalendarSummary {
  totalEvents: number;
  personalEvents: number;
  circleEvents: number;
  goingCount: number;
  maybeCount: number;
  notGoingCount: number;
  conflictsCount: number;
}

export interface ListUnifiedCalendarResult {
  events: UnifiedEvent[];
  summary: UnifiedCalendarSummary;
}

export interface ListUnifiedCalendarDeps {
  personalEventRepo: IPersonalEventRepository;
  circleRepo: ICircleRepository;
  eventRepo: IEventRepository;
  eventRsvpRepo: IEventRsvpRepository;
}

export class ListUnifiedCalendarUseCase {
  constructor(private deps: ListUnifiedCalendarDeps) {}

  async execute(
    input: ListUnifiedCalendarInput
  ): Promise<Result<ListUnifiedCalendarResult>> {
    const { userId, startDate, endDate, filter = "all" } = input;

    try {
      // 1. Fetch personal events
      const personalEventsResult =
        startDate && endDate
          ? await this.deps.personalEventRepo.findByUserIdAndDateRange(
              userId,
              startDate,
              endDate
            )
          : await this.deps.personalEventRepo.findByUserId(userId);

      if (!personalEventsResult.ok) {
        return Result.fail(
          personalEventsResult.error!,
          personalEventsResult.status!,
          personalEventsResult.errorCode!
        );
      }

      const personalEvents = personalEventsResult.data || [];

      // 2. Fetch user's circles
      const circlesResult = await this.deps.circleRepo.listMyCircles(userId);

      if (!circlesResult.ok) {
        return Result.fail(
          circlesResult.error!,
          circlesResult.status!,
          circlesResult.errorCode!
        );
      }

      const userCircles = circlesResult.data || [];
      const circleIds = userCircles.map((c: any) => c.id!);

      // 3. Fetch circle events
      let circleEvents: Event[] = [];
      const circleEventsMap = new Map<string, Event>();

      for (const circleId of circleIds) {
        const eventsResult = await this.deps.eventRepo.findByCircleId(circleId);
        if (eventsResult.ok && eventsResult.data) {
          const filteredEvents = eventsResult.data.filter((e) => {
            // Need a visible start/end (could be from poll placeholder)
            if (!e.startsAt || !e.endsAt) {
              return false;
            }

            // Apply date range filter if provided
            if (startDate && endDate) {
              const eventStart = new Date(e.startsAt);
              const eventEnd = new Date(e.endsAt);
              return eventStart <= endDate && eventEnd >= startDate;
            }

            return true;
          });

          filteredEvents.forEach((e) => circleEventsMap.set(e.id!, e));
        }
      }

      circleEvents = Array.from(circleEventsMap.values());

      // 4. Fetch RSVPs for all circle events
      const eventIds = circleEvents.map((e) => e.id!);
      const rsvpMap = new Map<string, EventRsvp>();

      for (const eventId of eventIds) {
        const rsvpResult = await this.deps.eventRsvpRepo.findByEventAndUser(
          eventId,
          userId
        );
        if (rsvpResult.ok && rsvpResult.data) {
          rsvpMap.set(eventId, rsvpResult.data);
        }
      }

      // 5. Get attendee counts for circle events
      const attendeeCountMap = new Map<string, number>();
      for (const eventId of eventIds) {
        const goingResult = await this.deps.eventRsvpRepo.countByStatus(
          eventId,
          "going"
        );
        if (goingResult.ok) {
          attendeeCountMap.set(eventId, goingResult.data || 0);
        }
      }

      // 6. Detect conflicts and build unified events
      const unifiedPersonalEvents: UnifiedPersonalEvent[] = personalEvents.map(
        (pe) => {
          // Skip conflict detection for cancelled personal events
          const conflicts = pe.cancelled
            ? []
            : this.findCircleConflicts(pe, circleEvents);
          return {
            id: pe.id!,
            type: "personal" as const,
            title: pe.title,
            startTime: pe.startTime,
            endTime: pe.endTime,
            allDay: pe.allDay || false,
            location: pe.location,
            color: pe.color,
            notes: pe.notes,
            reminderMinutes: pe.reminderMinutes,
            cancelled: pe.cancelled || false,
            conflictsWith: conflicts,
          };
        }
      );

      const unifiedCircleEvents: UnifiedCircleEvent[] = circleEvents.map(
        (ce) => {
          const rsvp = rsvpMap.get(ce.id!);
          const personalConflicts = this.findPersonalConflicts(
            ce,
            personalEvents
          );
          const circleConflicts = this.findOtherCircleConflicts(
            ce,
            circleEvents
          );
          const allConflicts = [...personalConflicts, ...circleConflicts];

          return {
            id: ce.id!,
            type: "circle" as const,
            title: ce.title,
            circleId: ce.circleId,
            circleName: ce.circle?.name || "Unknown Circle",
            circleColor: ce.circle?.color,
            startTime: ce.startsAt!,
            endTime: ce.endsAt!,
            allDay: ce.allDay || false,
            location: ce.location,
            status: ce.status || "draft",
            rsvpStatus: rsvp?.status || null,
            attendeeCount: attendeeCountMap.get(ce.id!) || 0,
            hasConflict: allConflicts.length > 0,
            conflictsWith: allConflicts,
            canChangeRsvp: true,
            isCreator: ce.userId === userId,
          };
        }
      );

      // 7. Filter events based on filter parameter
      let filteredPersonalEvents = unifiedPersonalEvents;
      let filteredCircleEvents = unifiedCircleEvents;

      if (filter === "personal") {
        filteredCircleEvents = [];
      } else if (filter === "going") {
        filteredPersonalEvents = [];
        filteredCircleEvents = filteredCircleEvents.filter(
          (e) => e.rsvpStatus === "going"
        );
      } else if (filter === "maybe") {
        filteredPersonalEvents = [];
        filteredCircleEvents = filteredCircleEvents.filter(
          (e) => e.rsvpStatus === "maybe"
        );
      } else if (filter === "not-going") {
        filteredPersonalEvents = [];
        filteredCircleEvents = filteredCircleEvents.filter(
          (e) => e.rsvpStatus === "not going"
        );
      }

      // 8. Merge and sort all events by startTime
      const allEvents: UnifiedEvent[] = [
        ...filteredPersonalEvents,
        ...filteredCircleEvents,
      ].sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      // 9. Calculate summary
      const summary: UnifiedCalendarSummary = {
        totalEvents: allEvents.length,
        personalEvents: filteredPersonalEvents.length,
        circleEvents: filteredCircleEvents.length,
        goingCount: filteredCircleEvents.filter((e) => e.rsvpStatus === "going")
          .length,
        maybeCount: filteredCircleEvents.filter((e) => e.rsvpStatus === "maybe")
          .length,
        notGoingCount: filteredCircleEvents.filter(
          (e) => e.rsvpStatus === "not going"
        ).length,
        conflictsCount: allEvents.filter((e) => e.conflictsWith.length > 0)
          .length,
      };

      return Result.ok({
        events: allEvents,
        summary,
      });
    } catch (error) {
      return Result.fail(
        "Failed to fetch unified calendar",
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Find circle events that conflict with a personal event
   */
  private findCircleConflicts(
    personalEvent: PersonalEvent,
    circleEvents: Event[]
  ): UnifiedEventConflict[] {
    const conflicts: UnifiedEventConflict[] = [];

    for (const ce of circleEvents) {
      if (
        ce.startsAt &&
        ce.endsAt &&
        this.hasTimeOverlap(
          personalEvent.startTime,
          personalEvent.endTime,
          ce.startsAt,
          ce.endsAt
        )
      ) {
        conflicts.push({
          id: ce.id!,
          title: ce.title,
          type: "circle",
          startTime: ce.startsAt,
          endTime: ce.endsAt,
        });
      }
    }

    return conflicts;
  }

  /**
   * Find personal events that conflict with a circle event
   */
  private findPersonalConflicts(
    circleEvent: Event,
    personalEvents: PersonalEvent[]
  ): UnifiedEventConflict[] {
    const conflicts: UnifiedEventConflict[] = [];

    if (!circleEvent.startsAt || !circleEvent.endsAt) {
      return conflicts;
    }

    for (const pe of personalEvents) {
      if (
        this.hasTimeOverlap(
          circleEvent.startsAt,
          circleEvent.endsAt,
          pe.startTime,
          pe.endTime
        )
      ) {
        conflicts.push({
          id: pe.id!,
          title: pe.title,
          type: "personal",
          startTime: pe.startTime,
          endTime: pe.endTime,
        });
      }
    }

    return conflicts;
  }

  /**
   * Find other circle events that conflict with a circle event
   */
  private findOtherCircleConflicts(
    circleEvent: Event,
    allCircleEvents: Event[]
  ): UnifiedEventConflict[] {
    const conflicts: UnifiedEventConflict[] = [];

    if (!circleEvent.startsAt || !circleEvent.endsAt) {
      return conflicts;
    }

    for (const ce of allCircleEvents) {
      // Skip self
      if (ce.id === circleEvent.id) {
        continue;
      }

      if (
        ce.startsAt &&
        ce.endsAt &&
        this.hasTimeOverlap(
          circleEvent.startsAt,
          circleEvent.endsAt,
          ce.startsAt,
          ce.endsAt
        )
      ) {
        conflicts.push({
          id: ce.id!,
          title: ce.title,
          type: "circle",
          startTime: ce.startsAt,
          endTime: ce.endsAt,
        });
      }
    }

    return conflicts;
  }

  /**
   * Check if two time ranges overlap
   */
  private hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();

    return s1 < e2 && s2 < e1;
  }
}
