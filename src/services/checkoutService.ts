import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Order, type OrderDoc } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";

type PublicOrderItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

export type PublicOrder = {
  id: string;
  buyerId: string;
  sellerId: string;
  items: PublicOrderItem[];
  totalAmount: number;
  status: "CONFIRMED";
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
  return new mongoose.Types.ObjectId(id);
}

function toPublicOrder(order: Pick<OrderDoc, "_id" | "buyerId" | "sellerId" | "items" | "totalAmount" | "status" | "idempotencyKey" | "createdAt" | "updatedAt">): PublicOrder {
  return {
    id: String(order._id),
    buyerId: String(order.buyerId),
    sellerId: String(order.sellerId),
    items: (order.items ?? []).map((i) => ({
      productId: String(i.productId),
      title: i.titleSnapshot,
      unitPrice: i.unitPriceSnapshot,
      quantity: i.quantity,
    })),
    totalAmount: order.totalAmount,
    status: order.status,
    idempotencyKey: order.idempotencyKey ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function checkout(params: { buyerId: string; idempotencyKey?: string | undefined }): Promise<{ orders: PublicOrder[] }> {
  const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");
  const idempotencyKey = params.idempotencyKey?.trim() ? params.idempotencyKey.trim() : undefined;

  if (idempotencyKey) {
    const existing = await Order.find({ buyerId, idempotencyKey }).sort({ createdAt: 1 }).exec();
    if (existing.length > 0) return { orders: existing.map(toPublicOrder) };
  }

  const session = await mongoose.startSession();
  try {
    const orders = await session.withTransaction(async () => {
      const cart = await Cart.findOne({ buyerId }).session(session).exec();
      if (!cart || (cart.items ?? []).length === 0) throw ApiError.badRequest("Cart is empty");

      if (idempotencyKey) {
        const existing = await Order.find({ buyerId, idempotencyKey }).session(session).sort({ createdAt: 1 }).exec();
        if (existing.length > 0) return existing;
      }

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
        if (!p) throw ApiError.notFound("Product not found");
        if (i.quantity > p.quantity) throw ApiError.badRequest("Insufficient stock");
      }

      for (const i of items) {
        const res = await Product.updateOne(
          { _id: i.productId, deletedAt: null, quantity: { $gte: i.quantity } },
          { $inc: { quantity: -i.quantity } },
          { session },
        ).exec();
        if (res.modifiedCount !== 1) throw ApiError.badRequest("Insufficient stock");
      }

      const bySeller = new Map<string, { sellerId: mongoose.Types.ObjectId; items: Array<{ productId: mongoose.Types.ObjectId; titleSnapshot: string; unitPriceSnapshot: number; quantity: number }>; totalAmount: number }>();
      for (const i of items) {
        const p = productById.get(String(i.productId));
        if (!p) throw ApiError.notFound("Product not found");

        const sellerKey = String(p.sellerId);
        const entry =
          bySeller.get(sellerKey) ??
          {
            sellerId: p.sellerId as unknown as mongoose.Types.ObjectId,
            items: [],
            totalAmount: 0,
          };

        entry.items.push({
          productId: i.productId as unknown as mongoose.Types.ObjectId,
          titleSnapshot: p.title,
          unitPriceSnapshot: p.price,
          quantity: i.quantity,
        });
        entry.totalAmount += p.price * i.quantity;
        bySeller.set(sellerKey, entry);
      }

      const toInsert = Array.from(bySeller.values()).map((g) => ({
        buyerId,
        sellerId: g.sellerId,
        items: g.items,
        totalAmount: g.totalAmount,
        status: "CONFIRMED" as const,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      }));

      let created: OrderDoc[];
      try {
        created = await Order.insertMany(toInsert, { session });
      } catch (err: unknown) {
        const maybeDup = typeof err === "object" && err !== null && "code" in err ? (err as { code?: unknown }).code : undefined;
        if (maybeDup === 11000 && idempotencyKey) {
          const existing = await Order.find({ buyerId, idempotencyKey }).session(session).sort({ createdAt: 1 }).exec();
          if (existing.length > 0) return existing;
        }
        throw err;
      }

      cart.items.splice(0, cart.items.length);
      await cart.save({ session });

      return created;
    });

    return { orders: orders.map(toPublicOrder) };
  } finally {
    session.endSession();
  }
}

