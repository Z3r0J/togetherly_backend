import { Request, Response, NextFunction } from "express";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
import {
  CreatePersonalEventUseCase,
  UpdatePersonalEventUseCase,
  DeletePersonalEventUseCase,
  ListPersonalEventsUseCase,
  GetPersonalEventDetailUseCase,
} from "@app/use-cases/calendar/index.js";
import {
  createPersonalEventSchema,
  updatePersonalEventSchema,
  listPersonalEventsSchema,
} from "@app/schemas/calendar/index.js";
import { PersonalEvent } from "@domain/entities/calendar/personal-event.entity.js";

/**
 * Personal Event Calendar Controller
 */
export class CalendarController {
  constructor(
    private createPersonalEventUseCase: CreatePersonalEventUseCase,
    private updatePersonalEventUseCase: UpdatePersonalEventUseCase,
    private deletePersonalEventUseCase: DeletePersonalEventUseCase,
    private listPersonalEventsUseCase: ListPersonalEventsUseCase,
    private getPersonalEventDetailUseCase: GetPersonalEventDetailUseCase
  ) {}

  /**
   * POST /api/calendar/events
   * Create a new personal event
   * Requires JWT authentication
   */
  createPersonalEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const validation = createPersonalEventSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          details: validation.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result: Result<PersonalEvent> =
        await this.createPersonalEventUseCase.execute({
          ...validation.data,
          userId: req.user.userId,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/calendar/events
   * List all personal events for authenticated user
   * Optional query params: startDate, endDate
   * Requires JWT authentication
   */
  listPersonalEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const validation = listPersonalEventsSchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          details: validation.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result: Result<PersonalEvent[]> =
        await this.listPersonalEventsUseCase.execute({
          userId: req.user.userId,
          startDate: validation.data.startDate,
          endDate: validation.data.endDate,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/calendar/events/:id
   * Get personal event details
   * Requires JWT authentication
   */
  getPersonalEventDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { id } = req.params;

      const result: Result<PersonalEvent> =
        await this.getPersonalEventDetailUseCase.execute({
          eventId: id,
          userId: req.user.userId,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/calendar/events/:id
   * Update a personal event
   * Requires JWT authentication
   */
  updatePersonalEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { id } = req.params;
      const validation = updatePersonalEventSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          details: validation.error.errors,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result: Result<PersonalEvent> =
        await this.updatePersonalEventUseCase.execute({
          eventId: id,
          userId: req.user.userId,
          ...validation.data,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/calendar/events/:id
   * Delete a personal event
   * Requires JWT authentication
   */
  deletePersonalEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { id } = req.params;

      const result = await this.deletePersonalEventUseCase.execute({
        eventId: id,
        userId: req.user.userId,
      });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper to send Result as HTTP response
   */
  private sendResult<T>(res: Response, result: Result<T>): void {
    const status = result.status || (result.ok ? 200 : 500);

    if (result.ok) {
      res.status(status).json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(status).json({
        success: false,
        errorCode: result.errorCode,
        message: result.error,
        details: result.details,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
