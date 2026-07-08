import { Response } from 'express';

interface ApiResponseData<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200, meta?: ApiResponseData<T>['meta']) {
    const response: ApiResponseData<T> = {
      success: true,
      statusCode,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Created') {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(res: Response, statusCode: number, message: string, errors: any[] = []) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
    });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success'
  ) {
    return ApiResponse.success(res, data, message, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
