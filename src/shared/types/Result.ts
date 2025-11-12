/**
 * Unified Result type for all operations
 * Replaces throwing errors with explicit success/failure handling
 */
export type Result<T> =
  | { ok: true; data: T; status?: number }
  | { ok: false; error: string; status?: number };

/**
 * Helper functions for creating Result types
 */
export const Result = {
  ok<T>(data: T, status?: number): Result<T> {
    return { ok: true, data, status };
  },

  fail<T = never>(error: string, status?: number): Result<T> {
    return { ok: false, error, status };
  },

  /**
   * Transform a Result's data if ok, otherwise pass through the error
   */
  map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
    if (result.ok) {
      return Result.ok(fn(result.data), result.status);
    }
    return result;
  },

  /**
   * Chain async operations that return Results
   */
  async chain<T, U>(
    result: Result<T>,
    fn: (data: T) => Promise<Result<U>>
  ): Promise<Result<U>> {
    if (result.ok) {
      return await fn(result.data);
    }
    return result;
  },

  /**
   * Combine multiple Results into one
   * If all are ok, returns ok with array of data
   * If any fail, returns the first failure
   */
  combine<T>(results: Result<T>[]): Result<T[]> {
    const data: T[] = [];
    for (const result of results) {
      if (!result.ok) {
        return result;
      }
      data.push(result.data);
    }
    return Result.ok(data);
  },
};
