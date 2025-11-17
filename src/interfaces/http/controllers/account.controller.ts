import {
  LoginResult,
  LoginWithPasswordUseCase,
  RegisterResult,
  RegisterUserWithPasswordUseCase,
  GetAuthenticatedUserUseCase,
  GetAuthenticatedUserResult,
  RequestMagicLinkUseCase,
  ValidateMagicLinkUseCase,
  ValidateMagicLinkResult,
} from "@app/use-cases";
import { Result } from "@shared/types";
import { Response, Request, NextFunction } from "express";

export class AccountController {
  constructor(
    private loginWithPasswordUseCase: LoginWithPasswordUseCase,
    private registerWithPasswordUseCase: RegisterUserWithPasswordUseCase,
    private getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase,
    private requestMagicLinkUseCase: RequestMagicLinkUseCase,
    private validateMagicLinkUseCase: ValidateMagicLinkUseCase
  ) {}

  loginWithPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result: Result<LoginResult> =
        await this.loginWithPasswordUseCase.execute(req.body);
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  registerWithPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result: Result<RegisterResult> =
        await this.registerWithPasswordUseCase.execute(req.body);
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get authenticated user information
   * This endpoint requires JWT authentication middleware
   */
  getAuthenticatedUser = async (
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

      const result: Result<GetAuthenticatedUserResult> =
        await this.getAuthenticatedUserUseCase.execute({
          userId: req.user.userId,
        });

      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request a magic link to be sent to the user's email
   */
  requestMagicLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result: Result<void> = await this.requestMagicLinkUseCase.execute(
        req.body
      );
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate a magic link token and return user info with JWT tokens
   */
  validateMagicLink = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result: Result<ValidateMagicLinkResult> =
        await this.validateMagicLinkUseCase.execute(req.body);
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
