import type { Request, Response } from "express";
import { messages } from "../constants/messages.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import * as authService from "../services/authService.js";
import type { UserRole } from "../types/auth.js";

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register({
    email: (req.body as { email: string }).email,
    password: (req.body as { password: string }).password,
    role: (req.body as { role: UserRole }).role,
  });

  sendSuccess(res, { statusCode: 201, message: messages.AUTH.REGISTER_SUCCESS, data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login({
    email: (req.body as { email: string }).email,
    password: (req.body as { password: string }).password,
  });

  sendSuccess(res, { message: messages.AUTH.LOGIN_SUCCESS, data: result });
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized();

  const result = await authService.me({ userId });
  sendSuccess(res, { message: messages.AUTH.ME_SUCCESS, data: result });
}

