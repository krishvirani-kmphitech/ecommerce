import mongoose from "mongoose";
import { Product, type ProductDoc } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";

export type PublicProduct = {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicProduct(
  p: Pick<ProductDoc, "_id" | "sellerId" | "title" | "category" | "price" | "quantity" | "deletedAt" | "createdAt" | "updatedAt">,
): PublicProduct {
  return {
    id: String(p._id),
    sellerId: String(p.sellerId),
    title: p.title,
    category: p.category,
    price: p.price,
    quantity: p.quantity,
    deletedAt: p.deletedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function ensureObjectId(id: string, message = "Invalid id"): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
  return new mongoose.Types.ObjectId(id);
}

export async function listPublic(): Promise<{ products: PublicProduct[] }> {
  const products = await Product.find({ deletedAt: null, quantity: { $gt: 0 } })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return { products: products.map((p) => toPublicProduct(p as ProductDoc)) };
}

export async function listPublicByCategory(params: { category: string }): Promise<{ products: PublicProduct[] }> {
  const category = params.category.trim();
  if (!category) throw ApiError.badRequest("Category is required");

  const products = await Product.find({ deletedAt: null, quantity: { $gt: 0 }, category })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return { products: products.map((p) => toPublicProduct(p as ProductDoc)) };
}

export async function getPublicById(params: { productId: string }): Promise<{ product: PublicProduct }> {
  const _id = ensureObjectId(params.productId, "Invalid product id");
  const product = await Product.findOne({ _id, deletedAt: null, quantity: { $gt: 0 } }).lean().exec();
  if (!product) throw ApiError.notFound("Product not found");
  return { product: toPublicProduct(product as ProductDoc) };
}

export async function listMine(params: { sellerId: string }): Promise<{ products: PublicProduct[] }> {
  const sellerId = ensureObjectId(params.sellerId, "Invalid seller id");
  const products = await Product.find({ sellerId, deletedAt: null }).sort({ createdAt: -1 }).lean().exec();
  return { products: products.map((p) => toPublicProduct(p as ProductDoc)) };
}

export async function create(params: {
  sellerId: string;
  title: string;
  category: string;
  price: number;
  quantity: number;
}): Promise<{ product: PublicProduct }> {
  const sellerId = ensureObjectId(params.sellerId, "Invalid seller id");
  const product = await Product.create({
    sellerId,
    title: params.title,
    category: params.category,
    price: params.price,
    quantity: params.quantity,
  });
  return { product: toPublicProduct(product) };
}

export async function update(params: {
  sellerId: string;
  productId: string;
  patch: Partial<Pick<ProductDoc, "title" | "category" | "price" | "quantity">>;
}): Promise<{ product: PublicProduct }> {
  const sellerId = ensureObjectId(params.sellerId, "Invalid seller id");
  const productId = ensureObjectId(params.productId, "Invalid product id");

  const product = await Product.findOneAndUpdate(
    { _id: productId, sellerId, deletedAt: null },
    { $set: params.patch },
    { new: true },
  ).exec();
  if (!product) throw ApiError.notFound("Product not found");

  return { product: toPublicProduct(product) };
}

export async function softDelete(params: { sellerId: string; productId: string }): Promise<{ product: PublicProduct }> {
  const sellerId = ensureObjectId(params.sellerId, "Invalid seller id");
  const productId = ensureObjectId(params.productId, "Invalid product id");

  const product = await Product.findOneAndUpdate(
    { _id: productId, sellerId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  ).exec();
  if (!product) throw ApiError.notFound("Product not found");

  return { product: toPublicProduct(product) };
}

