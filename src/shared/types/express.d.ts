/**
 * Extend Express Request type to include authenticated user information
 */
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      email?: string;
    };
  }
}
