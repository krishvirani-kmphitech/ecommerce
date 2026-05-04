import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { messages } from "../constants/messages.js";
import * as cartService from "../services/cartService.js";

export async function getMyCart(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const result = await cartService.getMyCart({ buyerId });
  sendSuccess(res, { message: messages.CART.GET_SUCCESS, data: result });
}

export async function addItem(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const body = req.body as { productId: string; quantity: number };
  const result = await cartService.addItem({ buyerId, productId: body.productId, quantity: body.quantity });
  sendSuccess(res, { message: messages.CART.ADD_ITEM_SUCCESS, data: result });
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const body = req.body as { quantity: number };
  const result = await cartService.updateItem({
    buyerId,
    productId: req.params.productId as string,
    quantity: body.quantity,
  });
  sendSuccess(res, { message: messages.CART.UPDATE_ITEM_SUCCESS, data: result });
}

export async function removeItem(req: Request, res: Response): Promise<void> {
  const buyerId = req.user?.id;
  if (!buyerId) throw ApiError.unauthorized();

  const result = await cartService.removeItem({ buyerId, productId: req.params.productId as string });
  sendSuccess(res, { message: messages.CART.REMOVE_ITEM_SUCCESS, data: result });
}

