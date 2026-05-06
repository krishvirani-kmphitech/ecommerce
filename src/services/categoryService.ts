import mongoose from "mongoose";
import { Category, type CategoryDoc } from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";

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
  const categories = await Category.find().sort({ name: 1 }).lean().exec();
  return { list: categories.map((c) => toPublicCategory(c as CategoryDoc)) };
}

export async function create(params: { adminId: string; name: string }): Promise<{ category: PublicCategory }> {
  const createdBy = ensureObjectId(params.adminId, "Invalid admin id");
  const name = params.name.trim();
  if (!name) throw ApiError.badRequest("Category name is required");

  const dup = await Category.findOne({ name }).lean().exec();
  if (dup) throw ApiError.conflict("Category name already exists");

  try {
    const category = await Category.create({ name, createdBy });
    return { category: toPublicCategory(category) };
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: unknown }).code : undefined;
    if (code === 11000) throw ApiError.conflict("Category name already exists");
    throw err;
  }
}

export async function assertCategoryExists(categoryId: string): Promise<void> {
  const _id = ensureObjectId(categoryId, "Invalid category id");
  const exists = await Category.exists({ _id }).exec();
  if (!exists) throw ApiError.badRequest("Unknown category");
}
