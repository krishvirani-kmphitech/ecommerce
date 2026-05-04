import mongoose from "mongoose";
import { Cart, type CartDoc } from "../models/Cart.js";
import { Product, type ProductDoc } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";

export type PublicCartItem = {
  productId: string;
  quantity: number;
};

export type PublicCart = {
  id: string;
  buyerId: string;
  items: PublicCartItem[];
  createdAt: Date;
  updatedAt: Date;
};

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
  return new mongoose.Types.ObjectId(id);
}

function toPublicCart(cart: Pick<CartDoc, "_id" | "buyerId" | "items" | "createdAt" | "updatedAt">): PublicCart {
  return {
    id: String(cart._id),
    buyerId: String(cart.buyerId),
    items: (cart.items ?? []).map((i) => ({ productId: String(i.productId), quantity: i.quantity })),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

async function getOrCreateCart(buyerId: mongoose.Types.ObjectId): Promise<CartDoc> {
  const cart = await Cart.findOneAndUpdate({ buyerId }, { $setOnInsert: { buyerId, items: [] } }, { new: true, upsert: true }).exec();
  return cart;
}

async function ensurePurchasableProduct(productId: mongoose.Types.ObjectId): Promise<Pick<ProductDoc, "_id" | "quantity" | "deletedAt">> {
  const product = await Product.findById(productId).select({ quantity: 1, deletedAt: 1 }).lean().exec();
  if (!product || product.deletedAt) throw ApiError.notFound("Product not found");
  return product as Pick<ProductDoc, "_id" | "quantity" | "deletedAt">;
}

export async function getMyCart(params: { buyerId: string }): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");
  const cart = await getOrCreateCart(buyerId);
  return { cart: toPublicCart(cart) };
}

export async function addItem(params: { buyerId: string; productId: string; quantity: number }): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");
  const productId = ensureObjectId(params.productId, "Invalid product id");

  const product = await ensurePurchasableProduct(productId);
  if (params.quantity > product.quantity) throw ApiError.badRequest("Insufficient stock");

  const cart = await getOrCreateCart(buyerId);
  const existing = cart.items.find((i) => i.productId.toString() === productId.toString());
  const nextQty = (existing?.quantity ?? 0) + params.quantity;
  if (nextQty > product.quantity) throw ApiError.badRequest("Insufficient stock");

  if (existing) existing.quantity = nextQty;
  else cart.items.push({ productId, quantity: params.quantity });

  await cart.save();
  return { cart: toPublicCart(cart) };
}

export async function updateItem(params: {
  buyerId: string;
  productId: string;
  quantity: number;
}): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");
  const productId = ensureObjectId(params.productId, "Invalid product id");

  const product = await ensurePurchasableProduct(productId);
  if (params.quantity > product.quantity) throw ApiError.badRequest("Insufficient stock");

  const cart = await getOrCreateCart(buyerId);
  const existing = cart.items.find((i) => i.productId.toString() === productId.toString());
  if (!existing) throw ApiError.notFound("Cart item not found");

  existing.quantity = params.quantity;
  await cart.save();

  return { cart: toPublicCart(cart) };
}

export async function removeItem(params: { buyerId: string; productId: string }): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");
  const productId = ensureObjectId(params.productId, "Invalid product id");

  const cart = await getOrCreateCart(buyerId);
  const idx = cart.items.findIndex((i) => i.productId.toString() === productId.toString());
  if (idx < 0) throw ApiError.notFound("Cart item not found");
  cart.items.splice(idx, 1);

  await cart.save();
  return { cart: toPublicCart(cart) };
}

