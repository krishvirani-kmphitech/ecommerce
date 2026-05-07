import mongoose from "mongoose";
import { Return, type ReturnDoc } from "../models/Return.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { Notification } from "../models/Notification.js";

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
    const orderId = ensureObjectId(params.orderId, "Invalid order id");
    const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");

    const order = await Order.findOne({
        _id: orderId,
        buyerId,
        status: "DELIVERED",
    }).exec();

    if (!order) {
        throw ApiError.badRequest("Order not found or not in DELIVERED status");
    }

    if (!order.returnableUntil || new Date() > order.returnableUntil) {
        throw ApiError.badRequest("Return window has expired for this order");
    }

    const existingReturn = await Return.findOne({
        orderId,
        status: { $in: ["PENDING", "APPROVED"] },
    }).exec();

    if (existingReturn) {
        throw ApiError.badRequest("A return request already exists for this order");
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
    const returnId = ensureObjectId(params.returnId, "Invalid return id");
    const sellerId = ensureObjectId(params.sellerId, "Invalid seller id");

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
                throw ApiError.notFound("Return request not found or already processed");
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
    const returnId = ensureObjectId(params.returnId, "Invalid return id");
    const sellerId = ensureObjectId(params.sellerId, "Invalid seller id");

    const returnRequest = await Return.findOne({
        _id: returnId,
        sellerId,
        status: "PENDING",
    }).exec();

    if (!returnRequest) {
        throw ApiError.notFound("Return request not found or already processed");
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
    const userId = ensureObjectId(params.userId, "Invalid user id");

    const filter = params.userRole === "buyer" ? { buyerId: userId } : { sellerId: userId };

    const returns = await Return.find(filter).sort({ createdAt: -1 }).exec();

    return returns.map(toPublicReturn);
}

export async function getReturnRequest(params: {
    returnId: string;
    userId: string;
}): Promise<PublicReturn> {
    const returnId = ensureObjectId(params.returnId, "Invalid return id");
    const userId = ensureObjectId(params.userId, "Invalid user id");

    const returnRequest = await Return.findOne({
        _id: returnId,
        $or: [{ buyerId: userId }, { sellerId: userId }],
    }).exec();

    if (!returnRequest) {
        throw ApiError.notFound("Return request not found");
    }

    return toPublicReturn(returnRequest);
}
