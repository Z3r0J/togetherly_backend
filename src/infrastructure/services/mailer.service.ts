import nodemailer, { Transporter } from "nodemailer";
import { IMailerService, EmailOptions } from "@domain/ports/mailer.port.js";
import { ILogger } from "@domain/ports/logger.port.js";

export type MailerConfig = {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth?: {
    user: string;
    pass: string;
  };
  from: string; // Default from address
  appUrl: string; // Base URL for your application (for verification links)
};

/**
 * Nodemailer implementation of the Mailer Service
 * Handles sending various types of emails
 */
export class NodemailerService implements IMailerService {
  private transporter: Transporter;

  constructor(private config: MailerConfig, private logger: ILogger) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: config.auth,
      // Add additional options for better compatibility
      requireTLS: !config.secure && config.port === 587, // Use STARTTLS for port 587
      tls: {
        // Do not fail on invalid certs (for development)
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration on startup
    this.verifyConnection();
  }

  /**
   * Verify the SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.info("SMTP connection verified successfully", {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
      });
    } catch (error) {
      this.logger.error("Failed to verify SMTP connection", error as Error, {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
      });
    }
  }

  /**
   * Send a generic email
   * @param options - Email options (to, subject, text, html)
   * @returns Promise that resolves when email is sent
   */
  async send(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.info(`Email sent successfully to ${options.to}`, {
        subject: options.subject,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}`,
        error as Error,
        {
          subject: options.subject,
        }
      );
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  }

  /**
   * Send an email verification message
   * @param userId - The user ID
   * @param email - The recipient email address
   * @param token - The verification token
   * @returns Promise that resolves when email is sent
   */
  async sendVerifyEmail(
    _userId: string,
    email: string,
    token: string
  ): Promise<void> {
    const verificationUrl = `${this.config.appUrl}/api/auth/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a90e2;">Welcome to Togetherly!</h1>
            <p>Thank you for signing up. Please verify your email address to activate your account.</p>
            <div style="margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p style="margin-top: 30px; color: #999; font-size: 12px;">
              If you didn't create an account with Togetherly, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to Togetherly!

Thank you for signing up. Please verify your email address to activate your account.

Verification link: ${verificationUrl}

If you didn't create an account with Togetherly, please ignore this email.
    `;

    await this.send({
      to: email,
      subject: "Verify Your Email - Togetherly",
      text,
      html,
    });
  }

  /**
   * Send a password reset email
   * @param email - The recipient email address
   * @param token - The password reset token
   * @returns Promise that resolves when email is sent
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.config.appUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a90e2;">Reset Your Password</h1>
            <p>You requested to reset your password. Click the button below to create a new password.</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p style="margin-top: 30px; color: #999; font-size: 12px;">
              If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              This link will expire in 24 hours.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Reset Your Password

You requested to reset your password. Click the link below to create a new password.

Reset link: ${resetUrl}

If you didn't request a password reset, please ignore this email.
This link will expire in 24 hours.
    `;

    await this.send({
      to: email,
      subject: "Reset Your Password - Togetherly",
      text,
      html,
    });
  }

  /**
   * Send a welcome email
   * @param name - The user's name
   * @param email - The recipient email address
   * @returns Promise that resolves when email is sent
   */
  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Togetherly</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a90e2;">Welcome to Togetherly, ${name}!</h1>
            <p>Your account has been successfully verified and is now active.</p>
            <p>You can now start using all the features of Togetherly.</p>
            <div style="margin: 30px 0;">
              <a href="${this.config.appUrl}" 
                 style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Get Started
              </a>
            </div>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p style="margin-top: 30px; color: #999; font-size: 12px;">
              The Togetherly Team ❤️
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to Togetherly, ${name}!

Your account has been successfully verified and is now active.

You can now start using all the features of Togetherly.

Visit: ${this.config.appUrl}

If you have any questions, feel free to reach out to our support team.

The Togetherly Team ❤️
    `;

    await this.send({
      to: email,
      subject: "Welcome to Togetherly!",
      text,
      html,
    });
  }

  /**
   * Send a magic link email
   * @param email - The recipient email address
   * @param token - The magic link token
   * @returns Promise that resolves when email is sent
   */
  async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const magicLinkUrl = `${this.config.appUrl}/api/auth/verify-magic-link?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Magic Link</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a90e2;">Sign in to Togetherly</h1>
            <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
            <div style="margin: 30px 0;">
              <a href="${magicLinkUrl}" 
                 style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Sign In
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${magicLinkUrl}</p>
            <p style="margin-top: 30px; color: #999; font-size: 12px;">
              If you didn't request this magic link, please ignore this email.
              This link will expire in 15 minutes.
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Sign in to Togetherly

Click the link below to sign in to your account. This link will expire in 15 minutes.

Magic link: ${magicLinkUrl}

If you didn't request this magic link, please ignore this email.
    `;

    await this.send({
      to: email,
      subject: "Your Magic Link - Togetherly",
      text,
      html,
    });
  }

  /**
   * Send a circle invitation email
   * @param inviterName - Name of the person sending the invitation
   * @param circleName - Name of the circle
   * @param invitedEmail - Email address of the invited person
   * @param token - Invitation token
   * @param isRegistered - Whether the invited email is already registered
   * @returns Promise that resolves when email is sent
   */
  async sendCircleInvitationEmail(
    inviterName: string,
    circleName: string,
    invitedEmail: string,
    token: string,
    isRegistered: boolean
  ): Promise<void> {
    const deepLink = `togetherly://circle/join/${token}`;
    const webLink = `${this.config.appUrl}/join/${token}`;

    const registeredUserHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Circle Invitation - Togetherly</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a90e2;">You're Invited to Join ${circleName}!</h1>
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join the circle <strong>"${circleName}"</strong> on Togetherly.</p>
            <p>Click one of the buttons below to accept the invitation:</p>
            <div style="margin: 30px 0;">
              <a href="${deepLink}" 
                 style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
                Open in App
              </a>
              <a href="${webLink}" 
                 style="background-color: #6c757d; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Open in Browser
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This invitation will expire in 7 days.<br>
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Link not working? Copy and paste this URL into your browser:<br>
              ${webLink}
            </p>
          </div>
        </body>
      </html>
    `;

    const unregisteredUserHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Circle Invitation - Togetherly</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4a90e2;">You're Invited to Join ${circleName}!</h1>
            <p>Hi there!</p>
            <p><strong>${inviterName}</strong> has invited you to join the circle <strong>"${circleName}"</strong> on Togetherly.</p>
            <p>You'll need to create a Togetherly account first. Click the button below to get started:</p>
            <div style="margin: 30px 0;">
              <a href="${deepLink}" 
                 style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">
                Sign Up & Join
              </a>
              <a href="${webLink}" 
                 style="background-color: #6c757d; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Open in Browser
              </a>
            </div>
            <p style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <strong>Note:</strong> You'll need to sign up with this email address (${invitedEmail}) 
              to accept the invitation. After signing up, you'll automatically join the circle.
            </p>
            <p style="color: #666; font-size: 14px;">
              This invitation will expire in 7 days.<br>
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Link not working? Copy and paste this URL into your browser:<br>
              ${webLink}
            </p>
          </div>
        </body>
      </html>
    `;

    const html = isRegistered ? registeredUserHtml : unregisteredUserHtml;

    const text = isRegistered
      ? `
You're Invited to Join ${circleName}!

${inviterName} has invited you to join the circle "${circleName}" on Togetherly.

Accept invitation: ${webLink}

This invitation will expire in 7 days.
If you didn't expect this invitation, you can safely ignore this email.
      `
      : `
You're Invited to Join ${circleName}!

${inviterName} has invited you to join the circle "${circleName}" on Togetherly.

You'll need to create a Togetherly account first with this email address (${invitedEmail}).

Get started: ${webLink}

This invitation will expire in 7 days.
If you didn't expect this invitation, you can safely ignore this email.
      `;

    await this.send({
      to: invitedEmail,
      subject: `${inviterName} invited you to join ${circleName}`,
      text,
      html,
    });
  }
}
