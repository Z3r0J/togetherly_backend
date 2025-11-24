import { z } from "zod";

/**
 * Environment variables schema
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DB_TYPE: z
    .enum(["mysql", "mariadb", "postgres", "mssql", "oracle", "sqlite"])
    .default("mysql"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USERNAME: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_DATABASE: z.string().default("test"),

  // Security
  API_KEY: z.string().optional(),

  // JWT Configuration
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT access secret must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT refresh secret must be at least 32 characters"),
  JWT_VERIFICATION_SECRET: z
    .string()
    .min(32, "JWT verification secret must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  JWT_VERIFICATION_EXPIRY: z.string().default("24h"),

  // Hash Configuration
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // Email Configuration
  MAIL_HOST: z.string().default("localhost"),
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SECURE: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .or(z.boolean())
    .default(false),
  MAIL_USER: z.string().email().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("noreply@togetherly.app"),

  // App Configuration
  APP_URL: z.string().url().default("http://localhost:3000"),

  // Firebase Cloud Messaging Configuration (optional)
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 */
export const validateEnv = (): Env => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.format();
    throw new Error(
      `Environment validation failed: ${JSON.stringify(errors, null, 2)}`
    );
  }

  return result.data;
};
