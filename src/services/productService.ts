import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { Product, type ProductDoc } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { ApiError } from "../utils/ApiError.js";
import { assertCategoryExists } from "./categoryService.js";
import { Notification } from "../models/Notification.js";
import { messages } from "../constants/messages.js";

export type PublicProduct = {
  id: string;
  sellerId: string;
  title: string;
  categoryId: string;
  categoryName: string;
  price: number;
  quantity: number;
  avgRating: number;
  ratingCount: number;
  // deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicReview = {
  id: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
};

const categoryPopulate = { path: "categoryId" as const, select: "name" as const };

function pickCategory(categoryId: unknown): { categoryId: string; categoryName: string } {
  if (categoryId && typeof categoryId === "object" && "name" in categoryId && "_id" in categoryId) {
    const c = categoryId as { _id: unknown; name: string };
    return { categoryId: String(c._id), categoryName: c.name };
  }
  return { categoryId: String(categoryId), categoryName: "" };
}

function toPublicProduct(
  p: Pick<ProductDoc, "_id" | "sellerId" | "title" | "price" | "quantity" | "avgRating" | "ratingCount" | "createdAt" | "updatedAt"> & {
    categoryId: unknown;
  },
): PublicProduct {
  const cat = pickCategory(p.categoryId);
  return {
    id: String(p._id),
    sellerId: String(p.sellerId),
    title: p.title,
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    price: p.price,
    quantity: p.quantity,
    avgRating: p.avgRating,
    ratingCount: p.ratingCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

async function getProductReviews(productId: mongoose.Types.ObjectId, page: number, limit: number): Promise<PublicReview[]> {

  const skip = (page - 1) * limit;

  const reviews = await Review.find({ productId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

  return reviews.map((review) => ({
    id: String(review._id),
    buyerId: String(review.buyerId),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }));
}

function ensureObjectId(id: string, message = "Invalid id"): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
  return new mongoose.Types.ObjectId(id);
}

function publicCatalogFilter(categoryId?: mongoose.Types.ObjectId): Record<string, unknown> {
  const base = { deletedAt: null, quantity: { $gt: 0 } } as Record<string, unknown>;
  if (categoryId) base.categoryId = categoryId;
  return base;
}

function publicCatalogFilterMine(sellerId: mongoose.Types.ObjectId, categoryId?: mongoose.Types.ObjectId): Record<string, unknown> {
  const base = { deletedAt: null, sellerId: sellerId } as Record<string, unknown>;
  if (categoryId) base.categoryId = categoryId;
  return base;
}

export async function listPublic(params: {
  page: number;
  limit: number;
  categoryId?: string;
}): Promise<{
  list: PublicProduct[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  let categoryOid: mongoose.Types.ObjectId | undefined;
  if (params.categoryId !== undefined) {
    categoryOid = ensureObjectId(params.categoryId, messages.COMMON.INVALID_CATEGORY);
    const exists = await Category.exists({ _id: categoryOid }).exec();
    if (!exists) throw ApiError.notFound(messages.COMMON.CATEGORY_NOT_FOUND);
  }

  const filter = publicCatalogFilter(categoryOid);
  const skip = (params.page - 1) * params.limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate(categoryPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean()
      .exec(),
    Product.countDocuments(filter).exec(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);

  return {
    list: products.map((p) => toPublicProduct(p as ProductDoc & { categoryId: unknown })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
    },
  };
}


// export async function listPublicByCategory(params: { categoryId: string }): Promise<{ list: PublicProduct[] }> {
//   const categoryId = ensureObjectId(params.categoryId, messages.COMMON.INVALID_CATEGORY);
//   const exists = await Category.exists({ _id: categoryId }).exec();
//   if (!exists) throw ApiError.notFound(messages.COMMON.CATEGORY_NOT_FOUND);

//   const products = await Product.find({ deletedAt: null, quantity: { $gt: 0 }, categoryId })
//     .populate(categoryPopulate)
//     .sort({ createdAt: -1 })
//     .lean()
//     .exec();

//   return {
//     list: products.map((p) => toPublicProduct(p as ProductDoc & { categoryId: unknown })),
//   };
// }

export async function getPublicById(params: { productId: string, page: number, limit: number }): Promise<{ product: PublicProduct; reviews: PublicReview[] }> {
  const _id = ensureObjectId(params.productId, messages.COMMON.INVALID_PRODUCT);

  const product = await Product.findOne({ _id, deletedAt: null, quantity: { $gt: 0 } })
    .populate(categoryPopulate)
    .lean()
    .exec();
  if (!product) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);

  const reviews = await getProductReviews(_id, params.page, params.limit);

  return {
    product: toPublicProduct(product as ProductDoc & { categoryId: unknown }),
    reviews,
  };
}

export async function listMine(params: { sellerId: string; page: number; limit: number; categoryId?: string }): Promise<{ list: PublicProduct[], pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);

  let categoryOid: mongoose.Types.ObjectId | undefined;
  if (params.categoryId !== undefined) {
    categoryOid = ensureObjectId(params.categoryId, messages.COMMON.INVALID_CATEGORY);
    const exists = await Category.exists({ _id: categoryOid }).exec();
    if (!exists) throw ApiError.notFound(messages.COMMON.CATEGORY_NOT_FOUND);
  }

  const filter = publicCatalogFilterMine(sellerId, categoryOid);
  const skip = (params.page - 1) * params.limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate(categoryPopulate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean()
      .exec(),
    Product.countDocuments(filter).exec(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);

  return {
    list: products.map((p) => toPublicProduct(p as ProductDoc & { categoryId: unknown })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages
    }
  };
}

export async function create(params: {
  sellerId: string;
  title: string;
  categoryId: string;
  price: number;
  quantity: number;
}): Promise<{ product: PublicProduct }> {
  await assertCategoryExists(params.categoryId);
  const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);
  const categoryOid = ensureObjectId(params.categoryId, messages.COMMON.INVALID_CATEGORY);

  const product = await Product.create({
    sellerId,
    title: params.title,
    categoryId: categoryOid,
    price: params.price,
    quantity: params.quantity,
  });

  await Notification.create({
    userId: sellerId,
    title: `Product Created (${product._id})`,
    message: `Your product "${params.title}" has been created successfully.`
  });

  const populated = await product.populate(categoryPopulate);
  if (!populated) throw ApiError.internal(messages.COMMON.FAILED_TO_LOAD);
  return { product: toPublicProduct(populated as ProductDoc & { categoryId: unknown }) };
}

export async function update(params: {
  sellerId: string;
  productId: string;
  patch: Partial<{ title: string; categoryId: string; price: number; quantity: number }>;
}): Promise<{ product: PublicProduct }> {
  const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);
  const productId = ensureObjectId(params.productId, messages.COMMON.INVALID_PRODUCT);

  const $set: Record<string, unknown> = {};
  if (params.patch.title !== undefined) $set.title = params.patch.title;
  if (params.patch.price !== undefined) $set.price = params.patch.price;
  if (params.patch.quantity !== undefined) $set.quantity = params.patch.quantity;
  if (params.patch.categoryId !== undefined) {
    await assertCategoryExists(params.patch.categoryId);
    $set.categoryId = ensureObjectId(params.patch.categoryId, messages.COMMON.INVALID_CATEGORY);
  }

  const product = await Product.findOneAndUpdate({ _id: productId, sellerId, deletedAt: null }, { $set }, { new: true })
    .populate(categoryPopulate)
    .lean()
    .exec();
  if (!product) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);

  await Notification.create({
    userId: sellerId,
    title: `Product Updated (${product._id})`,
    message: `Your product "${product.title}" has been updated successfully.`
  });

  return { product: toPublicProduct(product as ProductDoc & { categoryId: unknown }) };
}

export async function softDelete(params: { sellerId: string; productId: string }): Promise<{ product: PublicProduct }> {
  const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);
  const productId = ensureObjectId(params.productId, messages.COMMON.INVALID_PRODUCT);

  const product = await Product.findOneAndUpdate(
    { _id: productId, sellerId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  )
    .populate(categoryPopulate)
    .lean()
    .exec();
  if (!product) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);

  await Notification.create({
    userId: sellerId,
    title: `Product Deleted (${product._id})`,
    message: `Your product "${product.title}" has been deleted successfully.`
  });

  return { product: toPublicProduct(product as ProductDoc & { categoryId: unknown }) };
}

