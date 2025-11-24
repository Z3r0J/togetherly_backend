import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";
import { Result } from "@shared/types/index.js";

/**
 * Personal Event Repository Interface
 */
export interface IPersonalEventRepository {
  create(event: PersonalEvent): Promise<Result<PersonalEvent>>;
  findById(id: string): Promise<Result<PersonalEvent | null>>;
  findByUserId(userId: string): Promise<Result<PersonalEvent[]>>;
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<PersonalEvent[]>>;
  update(
    id: string,
    updates: Partial<PersonalEvent>
  ): Promise<Result<PersonalEvent | null>>;
  softDelete(id: string): Promise<Result<void>>;
  checkOverlap(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<Result<PersonalEvent[]>>;
}
