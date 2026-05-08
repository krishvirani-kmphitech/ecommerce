import mongoose from "mongoose";
import { Order, type OrderDoc } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { Transaction } from "../models/Transaction.js";
import { Notification } from "../models/Notification.js";
import { messages } from "../constants/messages.js";

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

export type SellersOrder = {
  id: string;
  buyerId: string;
  sellerId: string;
  product: PublicOrderProduct;
  totalAmount: number;
  status: "CONFIRMED" | "REJECTED" | "CANCELLED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "ACCEPTED" | "RETURNED";
  shippingAddress: ShippingAddress;
  isPayout: boolean;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
  return new mongoose.Types.ObjectId(id);
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

function toSellersOrder(
  order: Pick<
    OrderDoc,
    "_id" | "buyerId" | "sellerId" | "productId" | "titleSnapshot" | "unitPriceSnapshot" | "quantity" | "totalAmount" | "status" | "shippingAddress" | "isPayout" | "idempotencyKey" | "createdAt" | "updatedAt"
  >,
): SellersOrder {
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
    isPayout: order.isPayout,
    idempotencyKey: order.idempotencyKey ?? null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function getMyOrders(params: { buyerId: string; page?: number; limit?: number }): Promise<{ orders: PublicOrder[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ buyerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Order.countDocuments({ buyerId }).exec(),
  ]);

  return {
    orders: orders.map(toPublicOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function getMyOrderDetails(params: { buyerId: string, orderId: string }): Promise<{ order: PublicOrder }> {

  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);
  const orderId = ensureObjectId(params.orderId, messages.COMMON.INVALID_ORDER);

  const order = await Order.findOne({ _id: orderId, buyerId })
    // .populate("sellerId", "email")
    .lean()
    .exec();

  if (!order) throw ApiError.notFound("order not found");

  return { order: toPublicOrder(order as OrderDoc) };

}

export async function getSellerOrder(params: { sellerId: string; page?: number; limit?: number }): Promise<{ orders: PublicOrder[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {

  const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER)
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ sellerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Order.countDocuments({ sellerId }).exec(),
  ]);

  return {
    orders: orders.map(toSellersOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  }

}

export async function cancelOrder(params: { buyerId: string, orderId: string }): Promise<{ order: PublicOrder }> {

  const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);
  const orderId = ensureObjectId(params.orderId, messages.COMMON.INVALID_ORDER);

  const session = await mongoose.startSession();
  try {
    const order = await session.withTransaction(async () => {
      const updated = await Order.findOneAndUpdate(
        { _id: orderId, buyerId, status: "CONFIRMED" },
        { $set: { status: "CANCELLED" as const } },
        { new: true, session }
      )
        .lean()
        .session(session)
        .exec();

      if (!updated) {
        const existing = await Order.findOne({ _id: orderId, buyerId }).lean().session(session).exec();
        if (!existing) throw ApiError.notFound(messages.COMMON.ORDER_NOT_FOUND);
        throw ApiError.conflict(`Cannot cancel order in '${existing.status}' state`);
      }

      await Product.updateOne(
        { _id: updated.productId },
        { $inc: { quantity: updated.quantity } },
        { session },
      ).exec();

      await Transaction.insertOne(
        {
          orderId: updated._id,
          buyerId: updated.buyerId,
          type: "refund",
          amount: updated.totalAmount,
        },
        { session },
      );

      await new Notification({
        userId: updated.sellerId,
        title: `Order Cancelled (${updated._id})`,
        message: `The order for ${updated.titleSnapshot} has been cancelled by the buyer.`,
      }).save({ session });

      return updated;
    });

    if (!order) throw ApiError.internal("Unable to cancel order");
    return { order: toPublicOrder(order as OrderDoc) };
  } finally {
    session.endSession();
  }
}

export async function rejectOrderBySeller(params: { sellerId: string, orderId: string }): Promise<{ order: PublicOrder }> {

  const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);
  const orderId = ensureObjectId(params.orderId, messages.COMMON.INVALID_ORDER);

  const session = await mongoose.startSession();

  try {

    const order = await session.withTransaction(async () => {
      const updated = await Order.findOneAndUpdate(
        { _id: orderId, sellerId, status: "CONFIRMED" },
        { $set: { status: "REJECTED" as const } },
        { new: true }
      )
        .lean()
        .exec();
      if (!updated) {
        const existing = await Order.findOne({ _id: orderId, sellerId }).lean().exec();
        if (!existing) throw ApiError.notFound(messages.COMMON.ORDER_NOT_FOUND);
        throw ApiError.conflict(`Cannot reject order in '${existing.status}' state`);
      }

      await Product.updateOne(
        { _id: updated.productId },
        { $inc: { quantity: updated.quantity } },
      ).exec();

      await Transaction.insertOne({
        orderId: updated._id,
        buyerId: updated.buyerId,
        type: "refund",
        amount: updated.totalAmount
      });

      await Notification.create({
        userId: updated.buyerId,
        title: `Order rejected (${updated._id})`,
        message: `The order for ${updated.titleSnapshot} has been rejected by the seller.`
      });

      return updated;

    });

    return { order: toPublicOrder(order as OrderDoc) };
  } finally {
    session.endSession();
  }
}

export async function outForDeliveryOrder(params: { sellerId: string, orderId: string }): Promise<{ order: PublicOrder }> {

  const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);
  const orderId = ensureObjectId(params.orderId, messages.COMMON.INVALID_ORDER);

  // Set returnableUntil to 1 hour from now
  const returnableUntil = new Date(Date.now() + 60 * 60 * 1000);

  const order = await Order.findOneAndUpdate(
    { _id: orderId, sellerId, status: "CONFIRMED" },
    { $set: { status: "OUT_FOR_DELIVERY", returnableUntil } },
    { new: true }
  )
    .lean()
    .exec();
  if (!order) {
    const existing = await Order.findOne({ _id: orderId, sellerId }).lean().exec();
    if (!existing) throw ApiError.notFound(messages.COMMON.ORDER_NOT_FOUND);
    throw ApiError.conflict(`Cannot out for delivery order in '${existing.status}' state`);
  }

  await Notification.create({
    userId: order.buyerId,
    title: `Order Out for Delivery (${order._id})`,
    message: `The order for ${order.titleSnapshot} is out for delivery.`
  });

  return { order: toPublicOrder(order as OrderDoc) };

}