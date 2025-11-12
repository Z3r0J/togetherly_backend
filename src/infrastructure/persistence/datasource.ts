import { DataSource } from "typeorm";
import { Env } from "@app/schemas/env.schema.js";
import { OAuthSchema, UserSchema } from "./schemas/account";

/**
 * Create TypeORM DataSource
 */
export const createDataSource = (env: Env): DataSource => {
  return new DataSource({
    type: env.DB_TYPE,
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    synchronize: env.NODE_ENV !== "production",
    logging: env.NODE_ENV === "development",
    entities: [UserSchema, OAuthSchema],
    migrations: [],
    subscribers: [],
  });
};
