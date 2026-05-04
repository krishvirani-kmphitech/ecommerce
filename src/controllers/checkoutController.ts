import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { messages } from "../constants/messages.js";
import * as checkoutService from "../services/checkoutService.js";

export async function checkout(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const idempotencyKey = req.header("idempotency-key") ?? undefined;
  const result = await checkoutService.checkout({ buyerId, idempotencyKey });
  sendSuccess(res, { statusCode: 201, message: messages.CHECKOUT.SUCCESS, data: result });
}

