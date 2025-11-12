import { describe, it, expect } from "vitest";
import { Result } from "@shared/types/Result.js";

describe("Result Type", () => {
  describe("ok", () => {
    it("should create a successful result", () => {
      const result = Result.ok({ id: 1, name: "test" }, 201);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ id: 1, name: "test" });
        expect(result.status).toBe(201);
      }
    });
  });

  describe("fail", () => {
    it("should create a failure result", () => {
      const result = Result.fail("Something went wrong", 400);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Something went wrong");
        expect(result.status).toBe(400);
      }
    });
  });

  describe("map", () => {
    it("should transform ok result data", () => {
      const result = Result.ok(5);
      const mapped = Result.map(result, (n) => n * 2);

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.data).toBe(10);
      }
    });

    it("should pass through fail result", () => {
      const result = Result.fail<number>("error");
      const mapped = Result.map(result, (n) => n * 2);

      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe("error");
      }
    });
  });

  describe("combine", () => {
    it("should combine multiple ok results", () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];

      const combined = Result.combine(results);

      expect(combined.ok).toBe(true);
      if (combined.ok) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it("should return first failure", () => {
      const results = [
        Result.ok(1),
        Result.fail<number>("error"),
        Result.ok(3),
      ];

      const combined = Result.combine(results);

      expect(combined.ok).toBe(false);
      if (!combined.ok) {
        expect(combined.error).toBe("error");
      }
    });
  });
});
