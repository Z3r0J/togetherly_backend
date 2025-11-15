import {
  LoginResult,
  LoginWithPasswordUseCase,
  RegisterResult,
  RegisterUserWithPasswordUseCase,
} from "@app/use-cases";
import { Result } from "@shared/types";
import { Response, Request, NextFunction } from "express";

export class AccountController {
  constructor(
    private loginWithPasswordUseCase: LoginWithPasswordUseCase,
    private registerWithPasswordUseCase: RegisterUserWithPasswordUseCase
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
