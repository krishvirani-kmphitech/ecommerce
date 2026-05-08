import mongoose from "mongoose";
import { Category, type CategoryDoc } from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { messages } from "../constants/messages.js";
import { Product } from "../models/Product.js";

export type PublicCategory = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicCategory(c: Pick<CategoryDoc, "_id" | "name" | "createdAt" | "updatedAt">): PublicCategory {
  return {
    id: String(c._id),
    name: c.name,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
  return new mongoose.Types.ObjectId(id);
}

export async function list(): Promise<{ list: PublicCategory[] }> {
  const categories = await Category.find({ deletedAt: null }).sort({ name: 1 }).lean().exec();
  return { list: categories.map((c) => toPublicCategory(c as CategoryDoc)) };
}

export async function create(params: { adminId: string; name: string }): Promise<{ category: PublicCategory }> {
  const createdBy = ensureObjectId(params.adminId, messages.COMMON.INVALID_ADMIN);
  const name = params.name.trim();
  if (!name) throw ApiError.badRequest(messages.CATEGORIES.NAME_REQUIRED);

  const dup = await Category.findOne({ name, deletedAt: null }).lean().exec();
  if (dup) throw ApiError.conflict(messages.CATEGORIES.ALREADY_EXISTS);

  try {
    const category = await Category.create({ name, createdBy });
    return { category: toPublicCategory(category) };
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: unknown }).code : undefined;
    if (code === 11000) throw ApiError.conflict(messages.CATEGORIES.ALREADY_EXISTS);
    throw err;
  }
}

export async function deleteCetagory(params: { categoryId: string }): Promise<{ category: PublicCategory }> {

  const productExist = await Product.findOne({ categoryId: params.categoryId });

  if(productExist) {
    throw ApiError.conflict(messages.CATEGORY.PRODUCT_EXIST_IN_CATEGORY);
  }

  const category = await Category.findOneAndUpdate(
    { _id: params.categoryId, deletedAt: null },
    { deletedAt: new Date() }
  );

  if (!category) {
    throw ApiError.notFound(messages.CATEGORIES.UNKNOWN);
  }

  return { category: toPublicCategory(category) }

}

export async function assertCategoryExists(categoryId: string): Promise<void> {
  const _id = ensureObjectId(categoryId, messages.COMMON.INVALID_CATEGORY);
  const exists = await Category.exists({ _id }).exec();
  if (!exists) throw ApiError.badRequest(messages.CATEGORIES.UNKNOWN);
}
