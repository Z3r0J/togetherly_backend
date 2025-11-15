import { IClock } from "@domain/ports/clock.port.js";

/**
 * System clock implementation
 * Returns the current system time
 */
export class SystemClock implements IClock {
  /**
   * Get the current date and time from the system
   * @returns The current Date
   */
  now(): Date {
    return new Date();
  }
}
