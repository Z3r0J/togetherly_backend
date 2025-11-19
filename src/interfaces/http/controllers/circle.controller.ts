import { Request, Response, NextFunction } from "express";
import { Result } from "@shared/types/index.js";
import {
  CreateCircleUseCase,
  UpdateCircleUseCase,
  DeleteCircleUseCase,
  ListMyCirclesUseCase,
  GetCircleDetailUseCase,
  CreateCircleResult,
  UpdateCircleResult,
  ListMyCirclesResult,
  GetCircleDetailResult,
} from "@app/use-cases/circles/index.js";

export class CircleController {
  constructor(
    private createCircleUseCase: CreateCircleUseCase,
    private updateCircleUseCase: UpdateCircleUseCase,
    private deleteCircleUseCase: DeleteCircleUseCase,
    private listMyCirclesUseCase: ListMyCirclesUseCase,
    private getCircleDetailUseCase: GetCircleDetailUseCase
  ) {}

  /**
   * POST /api/circles
   * Create a new circle
   * Requires JWT authentication
   */
  createCircle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
        return;
      }

      const result: Result<CreateCircleResult> =
        await this.createCircleUseCase.execute({
          ...req.body,
          ownerId: req.user.userId,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/circles/:id
   * Update a circle
   * Requires JWT authentication and admin/owner role
   */
  updateCircle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
        return;
      }

      const result: Result<UpdateCircleResult> =
        await this.updateCircleUseCase.execute({
          circleId: req.params.id,
          userId: req.user.userId,
          updates: req.body,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/circles/:id
   * Delete a circle (soft delete)
   * Requires JWT authentication and owner role
   */
  deleteCircle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
        return;
      }

      const result: Result<void> = await this.deleteCircleUseCase.execute({
        circleId: req.params.id,
        userId: req.user.userId,
      });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/circles
   * List all circles where user is member or owner
   * Requires JWT authentication
   */
  listMyCircles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
        return;
      }

      const result: Result<ListMyCirclesResult> =
        await this.listMyCirclesUseCase.execute({
          userId: req.user.userId,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/circles/:id
   * Get circle detail with members
   * Requires JWT authentication and membership
   */
  getCircleDetail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({
          success: false,
          error: "Unauthorized",
        });
        return;
      }

      const result: Result<GetCircleDetailResult> =
        await this.getCircleDetailUseCase.execute({
          circleId: req.params.id,
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
      });
    } else {
      res.status(status).json({
        success: false,
        error: result.error,
      });
    }
  }
}
