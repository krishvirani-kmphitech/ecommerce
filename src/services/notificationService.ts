import mongoose from "mongoose";
import { Notification, NotificationDoc } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { messages } from "../constants/messages.js";
// import { logger } from "../utils/logger.js";

export type PublicNotification = {
    id: string;
    userId: string;
    title: string;
    message: string;
    createdAt: Date;
    updatedAt: Date;
};

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
    return new mongoose.Types.ObjectId(id);
}

function toPublicNotification(n: Pick<NotificationDoc, "_id" | "userId" | "title" | "message" | "createdAt" | "updatedAt">): PublicNotification {
    return {
        id: String(n._id),
        userId: String(n.userId),
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
    };
}

export async function getNotification(params: { userId: string }): Promise<{ list: PublicNotification[] }> {

    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);

    const notification = await Notification.find({ userId: userId }).sort({ createdAt: -1 }).lean().exec();
    return { list: notification.map((n) => toPublicNotification(n)) };

}