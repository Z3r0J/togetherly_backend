import { Request, Response } from "express";
import { ErrorCode } from "@shared/errors/index.js";
import {
  CreateEventUseCase,
  GetEventDetailUseCase,
  UpdateEventUseCase,
  DeleteEventUseCase,
  UpdateRsvpUseCase,
  VoteEventTimeUseCase,
  LockEventUseCase,
  FinalizeEventUseCase,
} from "@app/use-cases/events";
import {
  CreateEventSchema,
  UpdateEventSchema,
  VoteEventTimeSchema,
  UpdateRsvpSchema,
  LockEventSchema,
} from "@app/schemas/events";

/**
 * Event Controller
 * Handles HTTP requests for event operations
 */
export class EventController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly getEventDetailUseCase: GetEventDetailUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly updateRsvpUseCase: UpdateRsvpUseCase,
    private readonly voteEventTimeUseCase: VoteEventTimeUseCase,
    private readonly lockEventUseCase: LockEventUseCase,
    private readonly finalizeEventUseCase: FinalizeEventUseCase
  ) {}

  /**
   * POST /api/events
   * Create a new event
   */
  createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const validation = CreateEventSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
          message: validation.error.errors[0].message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await this.createEventUseCase.execute(
        userId,
        validation.data
      );

      if (!result.ok) {
        res.status(result.status || 400).json({
          success: false,
          errorCode: result.errorCode || ErrorCode.EVENT_CREATE_FAILED,
          message: result.error,
          details: result.details,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * GET /api/events/:id
   * Get event details
   */
  getEventDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const eventId = req.params.id;

      const result = await this.getEventDetailUseCase.execute(userId, eventId);

      if (!result.ok) {
        res.status(404).json({
          ok: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  };

  /**
   * PUT /api/events/:id
   * Update event details
   */
  updateEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const eventId = req.params.id;
      const validation = UpdateEventSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          ok: false,
          error: validation.error.errors[0].message,
        });
        return;
      }

      const result = await this.updateEventUseCase.execute(
        userId,
        eventId,
        validation.data
      );

      if (!result.ok) {
        res.status(400).json({
          ok: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  };

  /**
   * DELETE /api/events/:id
   * Delete event (soft delete)
   */
  deleteEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const eventId = req.params.id;

      const result = await this.deleteEventUseCase.execute(userId, eventId);

      if (!result.ok) {
        res.status(400).json({
          ok: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  };

  /**
   * POST /api/events/:id/rsvp
   * Update RSVP status
   */
  updateRsvp = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const eventId = req.params.id;
      const validation = UpdateRsvpSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          ok: false,
          error: validation.error.errors[0].message,
        });
        return;
      }

      const result = await this.updateRsvpUseCase.execute(
        userId,
        eventId,
        validation.data
      );

      if (!result.ok) {
        res.status(400).json({
          ok: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  };

  /**
   * POST /api/events/:id/vote
   * Vote for event time
   */
  voteEventTime = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const eventId = req.params.id;
      const validation = VoteEventTimeSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          ok: false,
          error: validation.error.errors[0].message,
        });
        return;
      }

      const result = await this.voteEventTimeUseCase.execute(
        userId,
        eventId,
        validation.data
      );

      if (!result.ok) {
        res.status(400).json({
          ok: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  };

  /**
   * POST /api/events/:id/lock
   * Lock event with selected time
   */
  lockEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const eventId = req.params.id;
      const validation = LockEventSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          ok: false,
          error: validation.error.errors[0].message,
        });
        return;
      }

      const result = await this.lockEventUseCase.execute(
        userId,
        eventId,
        validation.data
      );

      if (!result.ok) {
        res.status(400).json({
          ok: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  };

  /**
   * POST /api/events/:id/finalize
   * Finalize event (auto-select winning time)
   */
  finalizeEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const eventId = req.params.id;

      const result = await this.finalizeEventUseCase.execute(userId, eventId);

      if (!result.ok) {
        res.status(400).json({
          ok: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: "Internal server error",
      });
    }
  };
}
