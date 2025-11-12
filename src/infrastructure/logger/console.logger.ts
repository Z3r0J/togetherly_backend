import { ILogger } from "@domain/ports/logger.port.js";

/**
 * Console Logger Implementation
 * Implements the domain ILogger interface
 */
export class ConsoleLogger implements ILogger {
  private readonly context: string;

  constructor(context: string = "App") {
    this.context = context;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("DEBUG", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("INFO", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("WARN", message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log("ERROR", message, {
      ...meta,
      error: error?.message,
      stack: error?.stack,
    });
  }

  fatal(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log("FATAL", message, {
      ...meta,
      error: error?.message,
      stack: error?.stack,
    });
  }

  private log(
    level: string,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();
    const colorize = this.getColor(level);

    const logLine = `[${timestamp}] ${colorize(level.padEnd(5))} [${
      this.context
    }] ${message}`;

    // eslint-disable-next-line no-console
    console.log(logLine);

    if (meta && Object.keys(meta).length > 0) {
      // eslint-disable-next-line no-console
      console.log("  ", JSON.stringify(meta, null, 2));
    }
  }

  private getColor(level: string): (text: string) => string {
    // Simple color codes for terminal
    const colors: Record<string, string> = {
      DEBUG: "\x1b[36m", // Cyan
      INFO: "\x1b[32m", // Green
      WARN: "\x1b[33m", // Yellow
      ERROR: "\x1b[31m", // Red
      FATAL: "\x1b[35m", // Magenta
    };

    const reset = "\x1b[0m";
    const color = colors[level] || "";

    return (text: string) => `${color}${text}${reset}`;
  }
}
