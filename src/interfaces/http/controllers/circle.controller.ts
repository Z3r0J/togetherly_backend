import { Request, Response, NextFunction } from "express";
import { Result } from "@shared/types/index.js";
import { ErrorCode } from "@shared/errors/index.js";
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
  SendCircleInvitationUseCase,
  SendCircleInvitationResult,
  GetInvitationDetailsUseCase,
  GetInvitationDetailsResult,
  AcceptCircleInvitationUseCase,
  GenerateShareLinkUseCase,
  GenerateShareLinkResult,
  JoinCircleViaShareLinkUseCase,
  JoinCircleViaShareLinkResult,
  GetCircleByShareTokenUseCase,
  GetCircleByShareTokenResult,
} from "@app/use-cases/circles/index.js";

export class CircleController {
  constructor(
    private createCircleUseCase: CreateCircleUseCase,
    private updateCircleUseCase: UpdateCircleUseCase,
    private deleteCircleUseCase: DeleteCircleUseCase,
    private listMyCirclesUseCase: ListMyCirclesUseCase,
    private getCircleDetailUseCase: GetCircleDetailUseCase,
    private sendCircleInvitationUseCase: SendCircleInvitationUseCase,
    private getInvitationDetailsUseCase: GetInvitationDetailsUseCase,
    private acceptCircleInvitationUseCase: AcceptCircleInvitationUseCase,
    private generateShareLinkUseCase: GenerateShareLinkUseCase,
    private joinCircleViaShareLinkUseCase: JoinCircleViaShareLinkUseCase,
    private getCircleByShareTokenUseCase: GetCircleByShareTokenUseCase
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
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
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
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
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
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
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
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
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
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
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
   * POST /api/circles/:circleId/invite
   * Send invitations to join a circle
   * Requires JWT authentication (owner/admin only)
   */
  sendInvitation = async (
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

      const { circleId } = req.params;
      const { emails, type } = req.body;

      const result: Result<SendCircleInvitationResult> =
        await this.sendCircleInvitationUseCase.execute({
          circleId,
          invitedEmails: emails,
          invitedBy: req.user.userId,
          type: type || "email",
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/circles/invitations/:token/join
   * Redirect to app with deep link (for email button clicks)
   * Public endpoint - no authentication required
   */
  redirectToApp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.params;

      // Validate token exists
      const result: Result<GetInvitationDetailsResult> =
        await this.getInvitationDetailsUseCase.execute({ token });

      if (!result.ok) {
        // Redirect to app with error
        res.redirect(`togetherly://invite/${token}?error=invalid`);
        return;
      }

      // Redirect to app with valid token
      res.redirect(`togetherly://invite/${token}`);
    } catch (error) {
      // Fallback redirect
      const { token } = req.params;
      res.redirect(`togetherly://invite/${token}?error=unknown`);
    }
  };

  /**
   * GET /api/circles/invitations/:token
   * Get invitation details (public endpoint)
   * No authentication required
   */
  getInvitationDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token } = req.params;

      const result: Result<GetInvitationDetailsResult> =
        await this.getInvitationDetailsUseCase.execute({ token });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/circles/invitations/:token/accept
   * Accept a circle invitation
   * Requires JWT authentication
   */
  acceptInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId || !req.user.email) {
        res.status(401).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { token } = req.params;

      const result = await this.acceptCircleInvitationUseCase.execute({
        token,
        userId: req.user.userId,
        userEmail: req.user.email,
      });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/circles/:circleId/share-link
   * Generate or get share link for a circle
   * Requires JWT authentication (owner/admin only)
   */
  generateShareLink = async (
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

      const { circleId } = req.params;

      const result: Result<GenerateShareLinkResult> =
        await this.generateShareLinkUseCase.execute({
          circleId,
          userId: req.user.userId,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/circles/share/:shareToken
   * Get circle details by share token (public endpoint)
   * No authentication required
   */
  getCircleByShareToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { shareToken } = req.params;

      const result: Result<GetCircleByShareTokenResult> =
        await this.getCircleByShareTokenUseCase.execute({ shareToken });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/circles/share/:shareToken/join
   * Join a circle using share link
   * Requires JWT authentication
   */
  joinViaShareLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId || !req.user.email) {
        res.status(401).json({
          success: false,
          errorCode: ErrorCode.UNAUTHORIZED,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { shareToken } = req.params;

      const result: Result<JoinCircleViaShareLinkResult> =
        await this.joinCircleViaShareLinkUseCase.execute({
          shareToken,
          userId: req.user.userId,
          userEmail: req.user.email,
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
