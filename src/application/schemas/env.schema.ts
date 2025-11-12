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
