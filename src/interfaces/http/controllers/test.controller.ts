import { Request, Response, NextFunction } from "express";
import { Result } from "@shared/types/Result.js";
import {
  CreateTestUseCase,
  GetTestUseCase,
  ListTestsUseCase,
  UpdateTestUseCase,
  DeleteTestUseCase,
} from "@app/use-cases/index.js";

/**
 * Thin HTTP adapter for Test operations
 * Delegates all business logic to use cases
 */
export class TestController {
  constructor(
    private readonly createTestUseCase: CreateTestUseCase,
    private readonly getTestUseCase: GetTestUseCase,
    private readonly listTestsUseCase: ListTestsUseCase,
    private readonly updateTestUseCase: UpdateTestUseCase,
    private readonly deleteTestUseCase: DeleteTestUseCase
  ) {}

  list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.listTestsUseCase.execute();
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  get = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.getTestUseCase.execute(id);
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.createTestUseCase.execute(req.body);
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.updateTestUseCase.execute(id, req.body);
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.deleteTestUseCase.execute(id);
      this.sendResult(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper to send Result as HTTP response
   */
  private sendResult<T>(res: Response, result: Result<T>): void {
    const status = result.status || (result.ok ? 200 : 500);

    if (result.ok) {
      res.status(status).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(status).json({
        success: false,
        error: result.error,
      });
    }
  }
}
