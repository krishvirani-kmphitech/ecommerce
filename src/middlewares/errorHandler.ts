import type { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const isOperational = err instanceof ApiError;

  if (!isOperational) {
    logger.error({ err }, "Unhandled error");
  }

  const body: { success: false; code?: string; message: string; details?: unknown } = {
    success: false,
    message: isOperational ? err.message : "Internal server error",
  };

  if (err instanceof ApiError) {
    if (err.code !== undefined) body.code = err.code;
    if (err.details !== undefined) body.details = err.details;
  }

  if (env.NODE_ENV !== "production" && !isOperational && err instanceof Error) {
    body.details = { ...(typeof body.details === "object" && body.details !== null ? body.details : {}), stack: err.stack };
  }

  res.status(statusCode).json(body);
};
