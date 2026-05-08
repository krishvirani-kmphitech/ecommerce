import mongoose from "mongoose";
import { Return, type ReturnDoc } from "../models/Return.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { Notification } from "../models/Notification.js";
import { messages } from "../constants/messages.js";

export type PublicReturn = {
    id: string;
    orderId: string;
    buyerId: string;
    sellerId: string;
    productId: string;
    reason: string;
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
    notes: string;
    createdAt: Date;
    updatedAt: Date;
};

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
    return new mongoose.Types.ObjectId(id);
}

function toPublicReturn(
    ret: Pick<
        ReturnDoc,
        "_id" | "orderId" | "buyerId" | "sellerId" | "productId" | "reason" | "amount" | "status" | "notes" | "createdAt" | "updatedAt"
    >,
): PublicReturn {
    return {
        id: String(ret._id),
        orderId: String(ret.orderId),
        buyerId: String(ret.buyerId),
        sellerId: String(ret.sellerId),
        productId: String(ret.productId),
        reason: ret.reason,
        amount: ret.amount,
        status: ret.status,
        notes: ret.notes,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
    };
}

export async function createReturnRequest(params: {
    orderId: string;
    buyerId: string;
    reason: string;
}): Promise<PublicReturn> {
    const orderId = ensureObjectId(params.orderId, messages.COMMON.INVALID_ORDER);
    const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);

    const order = await Order.findOne({
        _id: orderId,
        buyerId,
        status: "DELIVERED",
    }).exec();

    if (!order) {
        throw ApiError.badRequest(messages.ORDER.ORDER_NOT_IN_DELIVERED);
    }

    if (!order.returnableUntil || new Date() > order.returnableUntil) {
        throw ApiError.badRequest(messages.ORDER.RETURN_TIME_EXPIRED);
    }

    const existingReturn = await Return.findOne({
        orderId,
        status: { $in: ["PENDING", "APPROVED"] },
    }).exec();

    if (existingReturn) {
        throw ApiError.badRequest(messages.ORDER.REQUEST_ALREADY_EXIST);
    }

    const returnRequest = new Return({
        orderId,
        buyerId,
        sellerId: order.sellerId,
        productId: order.productId,
        reason: params.reason,
        amount: order.totalAmount,
    });

    await returnRequest.save();

    await Notification.create({
        userId: returnRequest.sellerId,
        title: "Return request created by buyer",
        message: `${returnRequest.orderId} for this order buyer create request for return product`
    });

    return toPublicReturn(returnRequest);
}

export async function approveReturn(params: {
    returnId: string;
    sellerId: string;
}): Promise<PublicReturn> {
    const returnId = ensureObjectId(params.returnId, messages.COMMON.INVALID_RETURN);
    const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);

    const session = await mongoose.startSession();
    try {
        const returnRequest = await session.withTransaction(async () => {
            const ret = await Return.findOne({
                _id: returnId,
                sellerId,
                status: "PENDING",
            })
                .session(session)
                .exec();

            if (!ret) {
                throw ApiError.notFound(messages.RETURN.REQUEST_NOT_FOUND_OR_EXIST);
            }

            ret.status = "APPROVED";
            await ret.save({ session });

            // Create refund transaction
            await Transaction.insertOne(
                {
                    orderId: ret.orderId,
                    buyerId: ret.buyerId,
                    sellerId: ret.sellerId,
                    type: "refund",
                    amount: ret.amount,
                },
                { session }
            );

            await Order.updateOne(
                { _id: ret.orderId },
                { status: "RETURNED" },
                { session }
            ).exec();

            // Add product quantity back
            await Product.updateOne(
                { _id: ret.productId },
                { $inc: { quantity: 1 } },
                { session }
            ).exec();

            await Notification.create(
                [{
                    userId: ret.buyerId,
                    title: `Return Approved (${ret._id})`,
                    message: `Your return request for order ${ret.orderId} has been approved.`
                }],
                { session }
            );

            return ret;
        });

        return toPublicReturn(returnRequest);
    } finally {
        await session.endSession();
    }
}

export async function rejectReturn(params: {
    returnId: string;
    sellerId: string;
    notes: string;
}): Promise<PublicReturn> {
    const returnId = ensureObjectId(params.returnId, messages.COMMON.INVALID_RETURN);
    const sellerId = ensureObjectId(params.sellerId, messages.COMMON.INVALID_SELLER);

    const returnRequest = await Return.findOne({
        _id: returnId,
        sellerId,
        status: "PENDING",
    }).exec();

    if (!returnRequest) {
        throw ApiError.notFound(messages.RETURN.REQUEST_NOT_FOUND_OR_EXIST);
    }

    returnRequest.status = "REJECTED";
    returnRequest.notes = params.notes;
    await returnRequest.save();

    await Notification.create(
        [{
            userId: returnRequest.buyerId,
            title: `Return Rejected (${returnRequest._id})`,
            message: `Your return request for order ${returnRequest.orderId} has been rejected.`
        }]
    );

    return toPublicReturn(returnRequest);
}

export async function getReturnRequests(params: {
    userId: string;
    userRole: "buyer" | "seller";
}): Promise<PublicReturn[]> {
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);

    const filter = params.userRole === "buyer" ? { buyerId: userId } : { sellerId: userId };

    const returns = await Return.find(filter).sort({ createdAt: -1 }).exec();

    return returns.map(toPublicReturn);
}

export async function getReturnRequest(params: {
    returnId: string;
    userId: string;
}): Promise<PublicReturn> {
    const returnId = ensureObjectId(params.returnId, messages.COMMON.INVALID_RETURN);
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);

    const returnRequest = await Return.findOne({
        _id: returnId,
        $or: [{ buyerId: userId }, { sellerId: userId }],
    }).exec();

    if (!returnRequest) {
        throw ApiError.notFound(messages.RETURN.REQUEST_NOT_FOUND);
    }

    return toPublicReturn(returnRequest);
}
