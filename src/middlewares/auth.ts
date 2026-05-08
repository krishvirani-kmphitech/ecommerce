import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import type { UserRole } from "../types/auth.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header("authorization");
  if (!header) return void next(ApiError.unauthorized("Missing Authorization header"));

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return void next(ApiError.unauthorized("Invalid Authorization header"));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };

    const isUserActive = await User.findOne({ _id: req.user.id, deletedAt: null }).lean().exec();

    if (!isUserActive) return void next(ApiError.unauthorized());

    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return void next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return void next(ApiError.forbidden());
    next();
  };
}

