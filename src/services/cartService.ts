import mongoose from "mongoose";
import { Cart, type CartDoc } from "../models/Cart.js";
import { Product, type ProductDoc } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { Order, type OrderDoc } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import * as addressService from "./addressService.js";
import { Notification } from "../models/Notification.js";
import { messages } from "../constants/messages.js";

export type PublicCartItem = {
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    categoryId: string;
    sellerId: string;
    availableQuantity: number;
  } | null;
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

type CartItemWithMaybeProduct = {
  productId: mongoose.Types.ObjectId | {
    _id: unknown;
    title: string;
    price: number;
    categoryId: unknown;
    sellerId: unknown;
    quantity: number;
    deletedAt: Date | null;
  };
  quantity: number;
};

type PublicOrderProduct = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type PublicOrder = {
  id: string;
  buyerId: string;
  sellerId: string;
  product: PublicOrderProduct;
  totalAmount: number;
  status: "CONFIRMED" | "REJECTED" | "CANCELLED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "ACCEPTED" | "RETURNED";
  shippingAddress: ShippingAddress;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicCart(cart: Pick<CartDoc, "_id" | "buyerId" | "createdAt" | "updatedAt"> & { items: CartItemWithMaybeProduct[] }): PublicCart {
  return {
    id: String(cart._id),
    buyerId: String(cart.buyerId),
    items: (cart.items ?? []).map((i) => {
      const productId = i.productId;
      const hasProduct =
        productId !== null &&
        typeof productId === "object" &&
        "_id" in productId &&
        "title" in productId &&
        "price" in productId &&
        "categoryId" in productId &&
        "sellerId" in productId &&
        "quantity" in productId;

      if (!hasProduct) {
        return { productId: String(productId), quantity: i.quantity, product: null };
      }

      const p = productId as {
        _id: unknown;
        title: string;
        price: number;
        categoryId: unknown;
        sellerId: unknown;
        quantity: number;
      };

      return {
        productId: String(p._id),
        quantity: i.quantity,
        product: {
          id: String(p._id),
          title: p.title,
          price: p.price,
          categoryId: String(p.categoryId),
          sellerId: String(p.sellerId),
          availableQuantity: p.quantity,
        },
      };
    }),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

function toPublicOrder(
  order: Pick<
    OrderDoc,
    "_id" | "buyerId" | "sellerId" | "productId" | "titleSnapshot" | "unitPriceSnapshot" | "quantity" | "totalAmount" | "status" | "shippingAddress" | "idempotencyKey" | "createdAt" | "updatedAt"
  >,
): PublicOrder {
  return {
    id: String(order._id),
    buyerId: String(order.buyerId),
    sellerId: String(order.sellerId),
    product: {
      productId: String(order.productId),
      title: order.titleSnapshot,
      unitPrice: order.unitPriceSnapshot,
      quantity: order.quantity,
    },
    totalAmount: order.totalAmount,
    status: order.status,
    shippingAddress: order.shippingAddress || { street: "", city: "", state: "", zip: "", country: "" },
    idempotencyKey: order.idempotencyKey ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function getOrCreateCart(buyerId: mongoose.Types.ObjectId): Promise<CartDoc> {
  const cart = await Cart.findOneAndUpdate({ buyerId }, { $setOnInsert: { buyerId, items: [] } }, { new: true, upsert: true }).exec();
  return cart;
}

async function loadCartWithProductDetails(cartId: mongoose.Types.ObjectId): Promise<Pick<CartDoc, "_id" | "buyerId" | "createdAt" | "updatedAt"> & { items: CartItemWithMaybeProduct[] }> {
  const cart = await Cart.findById(cartId)
    .populate({
      path: "items.productId",
      select: { title: 1, price: 1, categoryId: 1, sellerId: 1, quantity: 1, deletedAt: 1 },
      match: { deletedAt: null },
    })
    .lean()
    .exec();

  if (!cart) throw ApiError.notFound(messages.COMMON.CART_NOT_FOUND);
  return cart as Pick<CartDoc, "_id" | "buyerId" | "createdAt" | "updatedAt"> & { items: CartItemWithMaybeProduct[] };
}

async function ensurePurchasableProduct(productId: mongoose.Types.ObjectId): Promise<Pick<ProductDoc, "_id" | "quantity" | "deletedAt">> {
  const product = await Product.findOne({ _id: productId, status: "ACTIVE" }).select({ quantity: 1, deletedAt: 1 }).lean().exec();
  if (!product || product.deletedAt) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);
  return product as Pick<ProductDoc, "_id" | "quantity" | "deletedAt">;
}

export async function getMyCart(params: { buyerId: string }): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);
  const cart = await getOrCreateCart(buyerId);
  const detailed = await loadCartWithProductDetails(cart._id);
  return { cart: toPublicCart(detailed) };
}

export async function addItem(params: { buyerId: string; productId: string; quantity: number }): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);
  const productId = ensureObjectId(params.productId, messages.COMMON.INVALID_PRODUCT);

  const product = await ensurePurchasableProduct(productId);
  if (params.quantity > product.quantity) throw ApiError.badRequest(messages.COMMON.INSUFFICIENT_STOCK);

  const cart = await getOrCreateCart(buyerId);
  const existing = cart.items.find((i) => i.productId.toString() === productId.toString());
  const nextQty = (existing?.quantity ?? 0) + params.quantity;
  if (nextQty > product.quantity) throw ApiError.badRequest(messages.COMMON.INSUFFICIENT_STOCK);

  if (existing) existing.quantity = nextQty;
  else cart.items.push({ productId, quantity: params.quantity });

  await cart.save();
  const detailed = await loadCartWithProductDetails(cart._id);
  return { cart: toPublicCart(detailed) };
}

export async function updateItem(params: {
  buyerId: string;
  productId: string;
  quantity: number;
}): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);
  const productId = ensureObjectId(params.productId, messages.COMMON.INVALID_PRODUCT);

  const product = await ensurePurchasableProduct(productId);
  if (params.quantity > product.quantity) throw ApiError.badRequest(messages.COMMON.INSUFFICIENT_STOCK);

  const cart = await getOrCreateCart(buyerId);
  const existing = cart.items.find((i) => i.productId.toString() === productId.toString());
  if (!existing) throw ApiError.notFound(messages.CART.NOT_FOUND_ITEM);

  existing.quantity = params.quantity;
  await cart.save();

  const detailed = await loadCartWithProductDetails(cart._id);
  return { cart: toPublicCart(detailed) };
}

export async function removeItem(params: { buyerId: string; productId: string }): Promise<{ cart: PublicCart }> {
  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);
  const productId = ensureObjectId(params.productId, messages.COMMON.INVALID_PRODUCT);

  const cart = await getOrCreateCart(buyerId);
  const idx = cart.items.findIndex((i) => i.productId.toString() === productId.toString());
  if (idx < 0) throw ApiError.notFound(messages.CART.NOT_FOUND_ITEM);
  cart.items.splice(idx, 1);

  await cart.save();
  const detailed = await loadCartWithProductDetails(cart._id);
  return { cart: toPublicCart(detailed) };
}

export async function checkout(params: {
  buyerId: string;
  idempotencyKey?: string | undefined;
  primaryAddress: boolean;
  address?: { street: string; city: string; state: string; zip: string; country: string };
}): Promise<{ orders: PublicOrder[], totalAmount: number }> {
  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);
  const idempotencyKey = params.idempotencyKey?.trim() ? params.idempotencyKey.trim() : undefined;

  // Get shipping address
  let shippingAddress: ShippingAddress;
  if (params.primaryAddress) {
    const primaryAddr = await addressService.getPrimaryAddress({ userId: params.buyerId });
    if (!primaryAddr) {
      throw ApiError.badRequest(messages.ADDRESS.SET_PRIMARY_ADDRESS_FIRST);
    }
    shippingAddress = {
      street: primaryAddr.street,
      city: primaryAddr.city,
      state: primaryAddr.state,
      zip: primaryAddr.zip,
      country: primaryAddr.country,
    };
  } else {
    if (!params.address) {
      throw ApiError.badRequest(messages.ADDRESS.ADDRESS_REQUIRED);
    }
    shippingAddress = params.address;
  }

  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      // Check for existing orders with idempotency key (inside transaction for consistency)
      if (idempotencyKey) {
        const existing = await Order.find({ buyerId, idempotencyKey }).session(session).sort({ createdAt: 1 }).exec();
        if (existing.length > 0) return { orders: existing, totalAmount: 0 };
      }

      const cart = await Cart.findOne({ buyerId }).session(session).exec();
      if (!cart || (cart.items ?? []).length === 0) throw ApiError.badRequest(messages.COMMON.CART_IS_EMPTY);

      const items = cart.items ?? [];
      const productIds = items.map((i) => i.productId);

      const products = await Product.find({ _id: { $in: productIds }, deletedAt: null })
        .select({ sellerId: 1, title: 1, price: 1, quantity: 1 })
        .session(session)
        .lean()
        .exec();

      const productById = new Map<string, (typeof products)[number]>();
      for (const p of products) productById.set(String(p._id), p);

      for (const i of items) {
        const p = productById.get(String(i.productId));
        if (!p) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);
        if (i.quantity > p.quantity) throw ApiError.badRequest(messages.COMMON.INSUFFICIENT_STOCK);
      }

      for (const i of items) {
        const res = await Product.updateOne(
          { _id: i.productId, status: "ACTIVE", quantity: { $gte: i.quantity } },
          { $inc: { quantity: -i.quantity } },
          { session },
        ).exec();
        if (res.modifiedCount !== 1) throw ApiError.badRequest(messages.COMMON.INSUFFICIENT_STOCK);
      }

      const toInsert = items.map((i) => {
        const p = productById.get(String(i.productId));
        if (!p) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);

        return {
          buyerId,
          sellerId: p.sellerId as unknown as mongoose.Types.ObjectId,
          productId: i.productId as unknown as mongoose.Types.ObjectId,
          titleSnapshot: p.title,
          unitPriceSnapshot: p.price,
          quantity: i.quantity,
          totalAmount: p.price * i.quantity,
          paymentStatus: "PAID",
          status: "CONFIRMED" as const,
          shippingAddress,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        };
      });

      let created: OrderDoc[];
      try {
        created = await Order.insertMany(toInsert, { session });

        for (const order of created) {
          await Transaction.insertOne({
            orderId: order._id,
            buyerId: order.buyerId,
            type: "pay",
            amount: order.totalAmount
          }, { session });
        }

      } catch (err: unknown) {
        const maybeDup = typeof err === "object" && err !== null && "code" in err ? (err as { code?: unknown }).code : undefined;
        if (maybeDup === 11000 && idempotencyKey) {
          const existing = await Order.find({ buyerId, idempotencyKey }).session(session).sort({ createdAt: 1 }).exec();
          if (existing.length > 0) return { orders: existing, totalAmount: 0 };
        }
        throw err;
      }

      cart.items.splice(0, cart.items.length);
      await cart.save({ session });

      // Create notifications for sellers (inside transaction for consistency)
      const notifications = created.map((order) => ({
        userId: order.sellerId,
        title: "New Order Placed",
        message: `You have a new order for ${order.titleSnapshot}.`
      }));

      await Notification.insertMany(notifications, { session });

      const totalAmount = created.reduce((sum, order) => sum + order.totalAmount, 0);

      return { orders: created, totalAmount };
    });

    return { orders: result.orders.map(toPublicOrder), totalAmount: result.totalAmount };
  } finally {
    session.endSession();
  }
}