/**
 * Clock port - Domain interface for getting current time
 * Implementation will be in infrastructure layer
 * This abstraction makes testing easier
 */
export interface IClock {
  /**
   * Get the current date and time
   * @returns The current Date
   */
  now(): Date;
}
