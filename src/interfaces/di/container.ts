import { DataSource } from "typeorm";
import { ILogger } from "@domain/ports/logger.port.js";
import {
  IHashService,
  ITokenService,
  IMailerService,
  IClock,
} from "@domain/ports/index.js";
import {
  LoginWithPasswordUseCase,
  RegisterUserWithPasswordUseCase,
  GetAuthenticatedUserUseCase,
  RequestMagicLinkUseCase,
  ValidateMagicLinkUseCase,
  ValidateEmailVerificationUseCase,
} from "@app/use-cases/index.js";
import {
  CreateCircleUseCase,
  UpdateCircleUseCase,
  DeleteCircleUseCase,
  ListMyCirclesUseCase,
  GetCircleDetailUseCase,
  SendCircleInvitationUseCase,
  GetInvitationDetailsUseCase,
  AcceptCircleInvitationUseCase,
  GenerateShareLinkUseCase,
  JoinCircleViaShareLinkUseCase,
  GetCircleByShareTokenUseCase,
} from "@app/use-cases/circles/index.js";
import {
  CreateEventUseCase,
  GetEventDetailUseCase,
  UpdateEventUseCase,
  DeleteEventUseCase,
  UpdateRsvpUseCase,
  VoteEventTimeUseCase,
  LockEventUseCase,
  FinalizeEventUseCase,
} from "@app/use-cases/events/index.js";
import {
  ICredentialRepository,
  IMagicLinkRepository,
  IOAuthAccountRepository,
  IUserRepository,
} from "@domain/ports/account.repository.js";
import {
  ICircleRepository,
  ICircleMemberRepository,
  ICircleInvitationRepository,
} from "@domain/ports/circle.repository.js";
import {
  IEventRepository,
  IEventRsvpRepository,
  IEventTimeRepository,
  IEventTimeVoteRepository,
} from "@domain/ports/event.repository.js";
import { UserRepository } from "@infra/persistence/index.js";
import { CredentialRepository } from "@infra/persistence/repositories/credential.repository.js";
import { OAuthRepository } from "@infra/persistence/repositories/oauth.repository.js";
import { MagicLinkTokenRepository } from "@infra/persistence/repositories/magic-link.repository.js";
import { CircleRepository } from "@infra/persistence/repositories/circle.repository.js";
import { CircleMemberRepository } from "@infra/persistence/repositories/circle-member.repository.js";
import { CircleInvitationRepository } from "@infra/persistence/repositories/circle-invitation.repository.js";
import { EventRepository } from "@infra/persistence/repositories/event.repository.js";
import { EventRsvpRepository } from "@infra/persistence/repositories/event-rsvp.repository.js";
import { EventTimeRepository } from "@infra/persistence/repositories/event-time.repository.js";
import { EventTimeVoteRepository } from "@infra/persistence/repositories/event-time-vote.repository.js";
import { AccountController } from "@interfaces/http/controllers/account.controller.js";
import { CircleController } from "@interfaces/http/controllers/circle.controller.js";
import { EventController } from "@interfaces/http/controllers/event.controller.js";
import {
  BcryptHashService,
  JwtTokenService,
  NodemailerService,
  SystemClock,
  type JwtConfig,
  type MailerConfig,
} from "@infra/services/index.js";
import { validateEnv } from "@app/schemas/env.schema.js";

/**
 * Simple dependency injection container
 * Centralizes the creation and wiring of all dependencies
 */
export class DIContainer {
  private static userRepository: IUserRepository;
  private static credentialRepository: ICredentialRepository;
  private static oauthRepository: IOAuthAccountRepository;
  private static magicLinkRepository: IMagicLinkRepository;
  private static circleRepository: ICircleRepository;
  private static circleMemberRepository: ICircleMemberRepository;
  private static circleInvitationRepository: ICircleInvitationRepository;
  private static eventRepository: IEventRepository;
  private static eventRsvpRepository: IEventRsvpRepository;
  private static eventTimeRepository: IEventTimeRepository;
  private static eventTimeVoteRepository: IEventTimeVoteRepository;

  // Services
  private static hashService: IHashService;
  private static tokenService: ITokenService;
  private static mailerService: IMailerService;
  private static clockService: IClock;

  private static accountController: AccountController;
  private static circleController: CircleController;
  private static eventController: EventController;

  /**
   * Initialize the container with core dependencies
   */
  static initialize(dataSource: DataSource, logger: ILogger): void {
    const env = validateEnv();

    // Repositories
    this.userRepository = new UserRepository(dataSource);
    this.credentialRepository = new CredentialRepository(dataSource);
    this.oauthRepository = new OAuthRepository(dataSource);
    this.magicLinkRepository = new MagicLinkTokenRepository(dataSource);
    this.circleRepository = new CircleRepository(dataSource);
    this.circleMemberRepository = new CircleMemberRepository(dataSource);
    this.circleInvitationRepository = new CircleInvitationRepository(
      dataSource
    );

    // Event Repositories
    this.eventRepository = new EventRepository(
      dataSource.getRepository("Event"),
      dataSource.getRepository("EventTime"),
      dataSource.getRepository("EventRsvp")
    );
    this.eventRsvpRepository = new EventRsvpRepository(
      dataSource.getRepository("EventRsvp")
    );
    this.eventTimeRepository = new EventTimeRepository(
      dataSource.getRepository("EventTime")
    );
    this.eventTimeVoteRepository = new EventTimeVoteRepository(
      dataSource.getRepository("EventTimeVote")
    );

    // Services
    this.hashService = new BcryptHashService(env.BCRYPT_SALT_ROUNDS);
    this.clockService = new SystemClock();

    // JWT Token Service
    const jwtConfig: JwtConfig = {
      accessTokenSecret: env.JWT_ACCESS_SECRET,
      refreshTokenSecret: env.JWT_REFRESH_SECRET,
      verificationTokenSecret: env.JWT_VERIFICATION_SECRET,
      accessTokenExpiry: env.JWT_ACCESS_EXPIRY,
      refreshTokenExpiry: env.JWT_REFRESH_EXPIRY,
      verificationTokenExpiry: env.JWT_VERIFICATION_EXPIRY,
    };
    this.tokenService = new JwtTokenService(jwtConfig);

    // Mailer Service
    const mailerConfig: MailerConfig = {
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      auth:
        env.MAIL_USER && env.MAIL_PASS
          ? {
              user: env.MAIL_USER,
              pass: env.MAIL_PASS,
            }
          : undefined,
      from: env.MAIL_FROM,
      appUrl: env.APP_URL,
    };
    this.mailerService = new NodemailerService(mailerConfig, logger);

    // Account Use Cases
    const loginWithPasswordUseCase = new LoginWithPasswordUseCase({
      userRepo: this.userRepository,
      credentialRepo: this.credentialRepository,
      hash: this.hashService,
      tokens: this.tokenService,
    });

    const registerUserWithPasswordUseCase = new RegisterUserWithPasswordUseCase(
      {
        userRepo: this.userRepository,
        credentialRepo: this.credentialRepository,
        hash: this.hashService,
        clock: this.clockService.now.bind(this.clockService),
        mailer: this.mailerService,
        verifyEmailToken: {
          issue: this.tokenService.issueVerificationToken.bind(
            this.tokenService
          ),
        },
      }
    );

    const getAuthenticatedUserUseCase = new GetAuthenticatedUserUseCase({
      userRepo: this.userRepository,
    });

    const requestMagicLinkUseCase = new RequestMagicLinkUseCase({
      userRepo: this.userRepository,
      magicLinkRepo: this.magicLinkRepository,
      mailer: this.mailerService,
      clock: this.clockService,
      tokenExpiryMinutes: 15,
    });

    const validateMagicLinkUseCase = new ValidateMagicLinkUseCase({
      magicLinkRepo: this.magicLinkRepository,
      userRepo: this.userRepository,
      tokenService: this.tokenService,
      clock: this.clockService,
    });

    const validateEmailVerificationUseCase =
      new ValidateEmailVerificationUseCase({
        userRepo: this.userRepository,
        tokenService: this.tokenService,
        clock: this.clockService,
      });

    // Circle Use Cases
    const createCircleUseCase = new CreateCircleUseCase({
      circleRepo: this.circleRepository,
      circleMemberRepo: this.circleMemberRepository,
    });

    const updateCircleUseCase = new UpdateCircleUseCase({
      circleRepo: this.circleRepository,
      circleMemberRepo: this.circleMemberRepository,
    });

    const deleteCircleUseCase = new DeleteCircleUseCase({
      circleRepo: this.circleRepository,
      circleMemberRepo: this.circleMemberRepository,
    });

    const listMyCirclesUseCase = new ListMyCirclesUseCase({
      circleRepo: this.circleRepository,
    });

    const getCircleDetailUseCase = new GetCircleDetailUseCase({
      circleRepo: this.circleRepository,
      circleMemberRepo: this.circleMemberRepository,
    });

    const sendCircleInvitationUseCase = new SendCircleInvitationUseCase({
      circleRepo: this.circleRepository,
      circleMemberRepo: this.circleMemberRepository,
      invitationRepo: this.circleInvitationRepository,
      userRepo: this.userRepository,
      mailerService: this.mailerService,
    });

    const getInvitationDetailsUseCase = new GetInvitationDetailsUseCase({
      invitationRepo: this.circleInvitationRepository,
      circleMemberRepo: this.circleMemberRepository,
    });

    const acceptCircleInvitationUseCase = new AcceptCircleInvitationUseCase({
      invitationRepo: this.circleInvitationRepository,
      circleMemberRepo: this.circleMemberRepository,
      userRepo: this.userRepository,
    });

    const generateShareLinkUseCase = new GenerateShareLinkUseCase({
      circleRepo: this.circleRepository,
      circleMemberRepo: this.circleMemberRepository,
    });

    const joinCircleViaShareLinkUseCase = new JoinCircleViaShareLinkUseCase({
      circleRepo: this.circleRepository,
      circleMemberRepo: this.circleMemberRepository,
      userRepo: this.userRepository,
    });

    const getCircleByShareTokenUseCase = new GetCircleByShareTokenUseCase({
      circleRepo: this.circleRepository,
    });

    // Event Use Cases
    const createEventUseCase = new CreateEventUseCase(
      this.eventRepository,
      this.eventTimeRepository,
      this.circleMemberRepository
    );

    const getEventDetailUseCase = new GetEventDetailUseCase(
      this.eventRepository,
      this.circleMemberRepository
    );

    const updateEventUseCase = new UpdateEventUseCase(
      this.eventRepository,
      this.circleMemberRepository
    );

    const deleteEventUseCase = new DeleteEventUseCase(
      this.eventRepository,
      this.circleMemberRepository
    );

    const updateRsvpUseCase = new UpdateRsvpUseCase(
      this.eventRsvpRepository,
      this.eventRepository,
      this.circleMemberRepository
    );

    const voteEventTimeUseCase = new VoteEventTimeUseCase(
      this.eventTimeVoteRepository,
      this.eventTimeRepository,
      this.eventRepository,
      this.circleMemberRepository
    );

    const lockEventUseCase = new LockEventUseCase(
      this.eventRepository,
      this.eventTimeRepository,
      this.circleMemberRepository
    );

    const finalizeEventUseCase = new FinalizeEventUseCase(
      this.eventRepository,
      this.eventTimeRepository,
      this.circleMemberRepository
    );

    // Controllers
    this.accountController = new AccountController(
      loginWithPasswordUseCase,
      registerUserWithPasswordUseCase,
      getAuthenticatedUserUseCase,
      requestMagicLinkUseCase,
      validateMagicLinkUseCase,
      validateEmailVerificationUseCase
    );

    this.circleController = new CircleController(
      createCircleUseCase,
      updateCircleUseCase,
      deleteCircleUseCase,
      listMyCirclesUseCase,
      getCircleDetailUseCase,
      sendCircleInvitationUseCase,
      getInvitationDetailsUseCase,
      acceptCircleInvitationUseCase,
      generateShareLinkUseCase,
      joinCircleViaShareLinkUseCase,
      getCircleByShareTokenUseCase
    );

    this.eventController = new EventController(
      createEventUseCase,
      getEventDetailUseCase,
      updateEventUseCase,
      deleteEventUseCase,
      updateRsvpUseCase,
      voteEventTimeUseCase,
      lockEventUseCase,
      finalizeEventUseCase
    );
  }

  // Static methods to get instances
  static getAccountController(): AccountController {
    if (!this.accountController) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.accountController;
  }

  static getCircleController(): CircleController {
    if (!this.circleController) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.circleController;
  }

  static getEventController(): EventController {
    if (!this.eventController) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.eventController;
  }

  // Service getters
  static getHashService(): IHashService {
    if (!this.hashService) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.hashService;
  }

  static getTokenService(): ITokenService {
    if (!this.tokenService) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.tokenService;
  }

  static getMailerService(): IMailerService {
    if (!this.mailerService) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.mailerService;
  }

  static getClockService(): IClock {
    if (!this.clockService) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.clockService;
  }

  // Repository getters for advanced use cases (if needed)
  static getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.userRepository;
  }

  static getCredentialRepository(): ICredentialRepository {
    if (!this.credentialRepository) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.credentialRepository;
  }

  static getOAuthRepository(): IOAuthAccountRepository {
    if (!this.oauthRepository) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.oauthRepository;
  }

  static getMagicLinkRepository(): IMagicLinkRepository {
    if (!this.magicLinkRepository) {
      throw new Error("Container not initialized. Call initialize() first.");
    }
    return this.magicLinkRepository;
  }

  /**
   * Clear all instances (useful for testing)
   */
  static reset(): void {
    this.userRepository = null as any;
    this.credentialRepository = null as any;
    this.oauthRepository = null as any;
    this.magicLinkRepository = null as any;
    this.hashService = null as any;
    this.tokenService = null as any;
    this.mailerService = null as any;
    this.clockService = null as any;
    this.accountController = null as any;
  }
}
