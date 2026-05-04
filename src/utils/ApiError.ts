export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, options?: { code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, { code: "BAD_REQUEST", details });
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message, { code: "UNAUTHORIZED" });
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message, { code: "FORBIDDEN" });
  }

  static notFound(message = "Not found"): ApiError {
    return new ApiError(404, message, { code: "NOT_FOUND" });
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError(409, message, { code: "CONFLICT", details });
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, message, { code: "INTERNAL_ERROR" });
  }
}
