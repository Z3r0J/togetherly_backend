import { describe, it, expect, beforeEach, vi } from "vitest";
import { Result } from "@shared/types/Result.js";
import { Test } from "@domain/entities/test.entity.js";
import { ITestRepository } from "@domain/ports/test.repository.js";
import { ILogger } from "@domain/ports/logger.port.js";
import { CreateTestUseCase } from "@app/use-cases/create-test.use-case.js";

describe("CreateTestUseCase", () => {
  let useCase: CreateTestUseCase;
  let mockRepository: ITestRepository;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockRepository = {
      create: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };

    useCase = new CreateTestUseCase(mockRepository, mockLogger);
  });

  it("should create a test successfully", async () => {
    const input = { name: "Test Name" };
    const createdTest: Test = {
      id: 1,
      name: "Test Name",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(mockRepository.create).mockResolvedValue(
      Result.ok(createdTest, 201)
    );

    const result = await useCase.execute(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Test Name");
      expect(result.status).toBe(201);
    }
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it("should fail with validation error for empty name", async () => {
    const input = { name: "" };

    const result = await useCase.execute(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Name is required");
      expect(result.status).toBe(400);
    }
    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("should fail when name exceeds 255 characters", async () => {
    const input = { name: "a".repeat(256) };

    const result = await useCase.execute(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("must be less than 255 characters");
    }
  });

  it("should handle repository errors", async () => {
    const input = { name: "Test Name" };
    vi.mocked(mockRepository.create).mockResolvedValue(
      Result.fail("Database error", 500)
    );

    const result = await useCase.execute(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Database error");
      expect(result.status).toBe(500);
    }
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
