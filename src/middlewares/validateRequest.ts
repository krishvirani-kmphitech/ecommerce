import type { NextFunction, Request, RequestHandler, Response } from "express";
import type Joi from "joi";
import { ApiError } from "../utils/ApiError.js";
import { messages } from "../constants/messages.js";

type JoiValidationDetail = {
  message: string;
  path: string;
  type: string;
};

function formatJoiDetails(details: Joi.ValidationErrorItem[]): JoiValidationDetail[] {
  return details.map((d) => ({
    message: d.message,
    path: d.path.join("."),
    type: d.type,
  }));
}

export function validateBody(schema: Joi.Schema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return void next(ApiError.badRequest(messages.AUTH.INVALID_BODY, formatJoiDetails(error.details)));
    }

    req.body = value;
    next();
  };
}

export function validateQuery(schema: Joi.Schema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return void next(ApiError.badRequest(messages.AUTH.INVALID_BODY, formatJoiDetails(error.details)));
    }

    req.validatedQuery = value;
    next();
  };
}

