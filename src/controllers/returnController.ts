import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import * as returnService from "../services/returnService.js";

export async function createReturn(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const result = await returnService.createReturnRequest({
    orderId: (req.body as { orderId: string }).orderId,
    buyerId,
    reason: (req.body as { reason: string }).reason,
  });

  sendSuccess(res, { statusCode: 201, message: "Return request created successfully", data: result });
}

export async function approveReturn(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const result = await returnService.approveReturn({
    returnId: (req.params as { id: string }).id,
    sellerId,
  });

  sendSuccess(res, { message: "Return approved successfully", data: result });
}

export async function rejectReturn(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const result = await returnService.rejectReturn({
    returnId: (req.params as { id: string }).id,
    sellerId,
    notes: (req.body as { notes: string }).notes || "",
  });

  sendSuccess(res, { message: "Return rejected successfully", data: result });
}

export async function getReturns(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized();

  const userRole = req.user?.role as "buyer" | "seller";
  const result = await returnService.getReturnRequests({
    userId,
    userRole,
  });

  sendSuccess(res, { message: "Returns fetched successfully", data: result });
}

export async function getReturn(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized();

  const result = await returnService.getReturnRequest({
    returnId: (req.params as { id: string }).id,
    userId,
  });

  sendSuccess(res, { message: "Return fetched successfully", data: result });
}
