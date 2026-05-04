import type { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";
import { messages } from "../constants/messages.js";
import * as productService from "../services/productService.js";

export async function listPublic(_req: Request, res: Response): Promise<void> {
  const result = await productService.listPublic();
  sendSuccess(res, { message: messages.PRODUCTS.LIST_SUCCESS, data: result });
}

export async function listPublicByCategory(req: Request, res: Response): Promise<void> {
  const category = req.params.category as string;
  const result = await productService.listPublicByCategory({ category });
  sendSuccess(res, { message: messages.PRODUCTS.LIST_SUCCESS, data: result });
}

export async function getPublicById(req: Request, res: Response): Promise<void> {
  const result = await productService.getPublicById({ productId: req.params.id as string });
  sendSuccess(res, { message: messages.PRODUCTS.GET_SUCCESS, data: result });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();
  const result = await productService.listMine({ sellerId });
  sendSuccess(res, { message: messages.PRODUCTS.LIST_MINE_SUCCESS, data: result });
}

export async function create(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const body = req.body as { title: string; category: string; price: number; quantity: number };
  const result = await productService.create({ sellerId, ...body });
  sendSuccess(res, { statusCode: 201, message: messages.PRODUCTS.CREATE_SUCCESS, data: result });
}

export async function update(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const patch = req.body as Partial<{ title: string; category: string; price: number; quantity: number }>;
  const result = await productService.update({
    sellerId,
    productId: req.params.id as string,
    patch,
  });
  sendSuccess(res, { message: messages.PRODUCTS.UPDATE_SUCCESS, data: result });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const result = await productService.softDelete({ sellerId, productId: req.params.id as string });
  sendSuccess(res, { message: messages.PRODUCTS.DELETE_SUCCESS, data: result });
}

