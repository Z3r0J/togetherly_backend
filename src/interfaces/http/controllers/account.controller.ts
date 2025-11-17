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
   * Validate magic link and redirect to mobile app or web
   * This endpoint is designed to be opened from email links
   * GET /auth/verify-magic-link?token=xxx
   */
  validateMagicLinkRedirect = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = req.query.token as string;

      if (!token) {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Invalid Link</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>❌ Invalid Magic Link</h1>
              <p>The magic link is missing or invalid.</p>
            </body>
          </html>
        `);
        return;
      }

      const result: Result<ValidateMagicLinkResult> =
        await this.validateMagicLinkUseCase.execute({ token });

      if (!result.ok) {
        res.status(result.status || 401).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Invalid Link</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h1>❌ Authentication Failed</h1>
              <p>${result.error}</p>
              <p style="margin-top: 30px;">
                <a href="${process.env.APP_URL}" style="color: #4a90e2;">Return to Home</a>
              </p>
            </body>
          </html>
        `);
        return;
      }

      // Success - redirect to mobile app with deep link or web fallback
      const { tokens } = result.data;

      // Encode tokens for URL
      const accessToken = encodeURIComponent(tokens.accessToken);
      const refreshToken = encodeURIComponent(tokens.refreshToken);

      // Deep link for mobile app (adjust scheme to your app's URL scheme)
      const mobileDeepLink = `togetherly://auth/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;

      // Web fallback URL
      const webUrl = `${process.env.APP_URL}/auth/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;

      // Send HTML that attempts to open the app, then falls back to web
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Opening Togetherly...</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ Authentication Successful!</h1>
            <p>Opening Togetherly app...</p>
            <p style="margin-top: 30px; color: #666;">
              If the app doesn't open, <a href="${webUrl}" id="webLink">click here</a>
            </p>
            <script>
              // Try to open the mobile app
              window.location.href = '${mobileDeepLink}';
              
              // After 2 seconds, if still on this page, redirect to web
              setTimeout(function() {
                document.getElementById('webLink').click();
              }, 2000);
            </script>
          </body>
        </html>
      `);
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
