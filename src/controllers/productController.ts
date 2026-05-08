import type { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";
import { messages } from "../constants/messages.js";
import * as productService from "../services/productService.js";

export async function listPublic(req: Request, res: Response): Promise<void> {
  const q = req.validatedQuery as { page: number; limit: number; categoryId?: string };
  const result = await productService.listPublic({
    page: q.page,
    limit: q.limit,
    ...(q.categoryId !== undefined ? { categoryId: q.categoryId } : {}),
  });
  sendSuccess(res, { message: messages.PRODUCTS.LIST_SUCCESS, data: result });
}

// export async function listPublicByCategory(req: Request, res: Response): Promise<void> {
//   const categoryId = req.params.categoryId as string;
//   const result = await productService.listPublicByCategory({ categoryId });
//   sendSuccess(res, { message: messages.PRODUCTS.LIST_SUCCESS, data: result });
// }

export async function getPublicById(req: Request, res: Response): Promise<void> {
  const q = req.validatedQuery as { page: number; limit: number };
  const result = await productService.getPublicById({ productId: req.params.id as string, page: q.page, limit: q.limit });
  sendSuccess(res, { message: messages.PRODUCTS.GET_SUCCESS, data: result });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const q = req.validatedQuery as { page: number; limit: number; categoryId?: string };
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();
  const result = await productService.listMine({
    sellerId,
    page: q.page,
    limit: q.limit,
    ...(q.categoryId !== undefined ? { categoryId: q.categoryId } : {}),
  });
  sendSuccess(res, { message: messages.PRODUCTS.LIST_MINE_SUCCESS, data: result });
}

export async function create(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const body = req.body as { title: string; categoryId: string; price: number; quantity: number };
  const result = await productService.create({ sellerId, ...body });
  sendSuccess(res, { statusCode: 201, message: messages.PRODUCTS.CREATE_SUCCESS, data: result });
}

export async function update(req: Request, res: Response): Promise<void> {
  const sellerId = req.user?.id;
  if (!sellerId) throw ApiError.unauthorized();

  const patch = req.body as Partial<{ title: string; categoryId: string; price: number; quantity: number }>;
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

