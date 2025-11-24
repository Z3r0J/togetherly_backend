import { DataSource } from "typeorm";
import { Env } from "@app/schemas/env.schema.js";
import {
  CredentialSchema,
  MagicLinkSchema,
  OAuthSchema,
  UserSchema,
} from "./schemas/account/index.js";
import {
  CircleSchema,
  CircleMemberSchema,
  CircleInvitationSchema,
} from "./schemas/circles/index.js";
import {
  EventSchema,
  EventRsvpSchema,
  EventTimeSchema,
  EventTimeVoteSchema,
} from "./schemas/events/index.js";

/**
 * Create TypeORM DataSource
 */
export const createDataSource = (env: Env): DataSource => {
  const config: any = {
    type: env.DB_TYPE,
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    synchronize: env.NODE_ENV !== "production",
    logging: env.NODE_ENV === "development",
    entities: [
      UserSchema,
      OAuthSchema,
      CredentialSchema,
      MagicLinkSchema,
      CircleSchema,
      CircleMemberSchema,
      CircleInvitationSchema,
      EventSchema,
      EventRsvpSchema,
      EventTimeSchema,
      EventTimeVoteSchema,
    ],
    migrations: [],
    subscribers: [],
  };

  // Add PostgreSQL-specific configuration
  if (env.DB_TYPE === "postgres") {
    config.ssl = { rejectUnauthorized: false };
    config.extra = {
      connectionTimeoutMillis: 90000,
      statement_timeout: 90000,
    };
  }

  // Add MySQL-specific configuration for Aiven
  if (env.DB_TYPE === "mysql" && env.DB_HOST.includes("aivencloud.com")) {
    config.ssl = {
      rejectUnauthorized: false,
    };
  }

  return new DataSource(config);
};
