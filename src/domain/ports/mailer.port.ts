/**
 * Mailer port - Domain interface for sending emails
 * Implementation will be in infrastructure layer
 */

export type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export interface IMailerService {
  /**
   * Send a generic email
   * @param options - Email options (to, subject, text, html)
   * @returns Promise that resolves when email is sent
   */
  send(options: EmailOptions): Promise<void>;

  /**
   * Send an email verification message
   * @param userId - The user ID
   * @param email - The recipient email address
   * @param token - The verification token
   * @returns Promise that resolves when email is sent
   */
  sendVerifyEmail(userId: string, email: string, token: string): Promise<void>;

  /**
   * Send a password reset email
   * @param email - The recipient email address
   * @param token - The password reset token
   * @returns Promise that resolves when email is sent
   */
  sendPasswordResetEmail(email: string, token: string): Promise<void>;

  /**
   * Send a welcome email
   * @param name - The user's name
   * @param email - The recipient email address
   * @returns Promise that resolves when email is sent
   */
  sendWelcomeEmail(name: string, email: string): Promise<void>;

  /**
   * Send a magic link email
   * @param email - The recipient email address
   * @param token - The magic link token
   * @returns Promise that resolves when email is sent
   */
  sendMagicLinkEmail(email: string, token: string): Promise<void>;
}
