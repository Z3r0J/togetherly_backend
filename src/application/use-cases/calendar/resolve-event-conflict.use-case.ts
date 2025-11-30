import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import { IPersonalEventRepository } from "@domain/ports/calendar.repository.js";
import { IEventRsvpRepository } from "@domain/ports/event.repository.js";

export interface ResolveEventConflictInput {
  userId: string;
  eventId: string;
  eventType: "personal" | "circle";
  action:
    | "cancel_personal"
    | "change_rsvp_maybe"
    | "change_rsvp_going"
    | "keep_both";
}

export interface ResolveEventConflictDeps {
  personalEventRepo: IPersonalEventRepository;
  eventRsvpRepo: IEventRsvpRepository;
}

export class ResolveEventConflictUseCase {
  constructor(private deps: ResolveEventConflictDeps) {}

  async execute(input: ResolveEventConflictInput): Promise<Result<string>> {
    const { userId, eventId, eventType, action } = input;
    try {
      if (eventType === "personal" && action === "cancel_personal") {
        // Mark personal event as cancelled (do not soft-delete)
        const result = await this.deps.personalEventRepo.update(eventId, {
          cancelled: true,
          cancelledAt: new Date(),
        });
        if (!result.ok) {
          return Result.fail(result.error!, result.status!, result.errorCode!);
        }
        return Result.ok("Personal event marked as cancelled");
      }
      if (
        eventType === "circle" &&
        (action === "change_rsvp_maybe" || action === "change_rsvp_going")
      ) {
        // Update RSVP status via upsert
        const status = action === "change_rsvp_maybe" ? "maybe" : "going";
        const upsertResult = await this.deps.eventRsvpRepo.upsert({
          eventId,
          userId,
          status,
        } as any);
        if (!upsertResult.ok) {
          return Result.fail(
            upsertResult.error || "Failed to update RSVP",
            upsertResult.status || 500,
            upsertResult.errorCode
          );
        }
        return Result.ok(`RSVP changed to ${status}`);
      }
      if (action === "keep_both") {
        // No action, just acknowledge
        return Result.ok("Kept both events as-is");
      }
      return Result.fail(
        "Invalid action or event type",
        400,
        ErrorCode.VALIDATION_FAILED
      );
    } catch (error) {
      return Result.fail(
        "Failed to resolve conflict",
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        {
          originalError: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }
}
