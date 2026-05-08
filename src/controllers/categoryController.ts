import type { Request, Response } from "express";
import { messages } from "../constants/messages.js";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import * as categoryService from "../services/categoryService.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const result = await categoryService.list();
  sendSuccess(res, { message: messages.CATEGORIES.LIST_SUCCESS, data: result });
}

export async function create(req: Request, res: Response): Promise<void> {
  const adminId = req.user?.id;
  if (!adminId) throw ApiError.unauthorized();

  const body = req.body as { name: string };
  const result = await categoryService.create({ adminId, name: body.name });
  sendSuccess(res, { statusCode: 201, message: messages.CATEGORIES.CREATE_SUCCESS, data: result });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {

  const result = await categoryService.deleteCetagory({
    categoryId: (req.params as { categoryId: string }).categoryId,
  });

  sendSuccess(res, { statusCode: 200, message: messages.CATEGORIES.DELETED_SUCCESS, data: result });

}