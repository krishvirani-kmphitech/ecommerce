import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { messages } from "../constants/messages.js";
import * as orderService from "../services/orderService.js";

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const q = req.validatedQuery as { page: number; limit: number };
  const result = await orderService.getMyOrders({ buyerId, page: q.page, limit: q.limit });
  sendSuccess(res, { statusCode: 200, message: messages.ORDER.GET_MY_ORDERS_SUCCESS, data: result });
}

export async function getMyOrderDetails(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const orderId = req.params.orderId as string | undefined;
  if (!orderId) throw ApiError.badRequest(messages.ORDER.ORDER_ID_REQUIRED);

  const result = await orderService.getMyOrderDetails({ buyerId, orderId });

  sendSuccess(res, { statusCode: 200, message: messages.ORDER.GET_ORDER_DETAILS_SUCCESS, data: result });
}

export async function getSellerOrder(req: Request, res: Response): Promise<void> {

  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const q = req.validatedQuery as { page: number; limit: number };
  const result = await orderService.getSellerOrder({ sellerId, page: q.page, limit: q.limit });
  sendSuccess(res, { statusCode: 200, message: messages.ORDER.GET_MY_ORDERS_SUCCESS, data: result });

}

export async function cancelOrder(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const orderId = req.params.orderId as string | undefined;
  if (!orderId) throw ApiError.badRequest("Order ID is required");

  const result = await orderService.cancelOrder({ buyerId, orderId });
  sendSuccess(res, { statusCode: 200, message: messages.ORDER.CANCEL_ORDER_SUCCESS, data: result });
}

export async function rejectOrderBySeller(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const orderId = req.params.orderId as string | undefined;
  if (!orderId) throw ApiError.badRequest("Order ID is required");

  const result = await orderService.rejectOrderBySeller({ sellerId, orderId });
  sendSuccess(res, { statusCode: 200, message: messages.ORDER.REJECT_ORDER_SUCCESS, data: result });
}

export async function outForDeliveryOrder(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const orderId = req.params.orderId as string | undefined;
  if (!orderId) throw ApiError.badRequest("Order ID is required");

  const result = await orderService.outForDeliveryOrder({ sellerId, orderId });
  sendSuccess(res, { statusCode: 200, message: messages.ORDER.DELIVERED_ORDER_SUCCESS, data: result });
}
