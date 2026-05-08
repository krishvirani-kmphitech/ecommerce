import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Review, ReviewDoc } from "../models/Review.js";
import { Order } from "../models/Order.js";
import { Notification } from "../models/Notification.js";
import { Product } from "../models/Product.js";
import { messages } from "../constants/messages.js";

export type PublicReview = {
    id: string;
    orderId: string;
    buyerId: string;
    productId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
    return new mongoose.Types.ObjectId(id);
}

function toPublicReview(
    ret: Pick<
        ReviewDoc,
        "_id" | "orderId" | "buyerId" | "productId" | "rating" | "comment" | "createdAt" | "updatedAt"
    >,
): PublicReview {
    return {
        id: String(ret._id),
        orderId: String(ret.orderId),
        buyerId: String(ret.buyerId),
        productId: String(ret.productId),
        rating: ret.rating,
        comment: ret.comment,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
    };
}

type MongoErrorWithCode = Error & { code?: number };

function isMongoDuplicateError(error: unknown): boolean {
    return (
        error instanceof Error &&
        (error as MongoErrorWithCode).code === 11000
    );
}

async function updateProductRatingStats(productId: mongoose.Types.ObjectId): Promise<void> {
    const reviews = await Review.find({ productId }).select('rating').lean().exec();
    const ratingCount = reviews.length;
    const avgRating = ratingCount > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount : 0;

    await Product.findByIdAndUpdate(productId, {
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        ratingCount
    });
}

export async function createReview(params: { orderId: string, productId: string, buyerId: string, rating: number, comment?: string }): Promise<PublicReview> {

    const orderId = ensureObjectId(params.orderId, messages.COMMON.INVALID_ORDER);
    const productId = ensureObjectId(params.productId, messages.COMMON.INVALID_PRODUCT);
    const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);

    const orderExist = await Order.findOne({ _id: orderId, productId, buyerId, status: { $in: ["DELIVERED", "ACCEPTED", "RETURNED"] } });

    if (!orderExist) throw ApiError.badRequest(messages.REVIEW.NOT_ELIGIBLE);

    try {

        const review = await Review.create({
            orderId,
            productId,
            buyerId,
            rating: params.rating,
            comment: params.comment || "",
        });

        await updateProductRatingStats(productId);

        await Notification.create({
            userId: orderExist.sellerId,
            title: `New Review for ${orderExist.productId}`,
            message: `A new review has been submitted for your product.`
        });

        return toPublicReview(review);

    } catch (error) {
        if (isMongoDuplicateError(error)) {
            throw ApiError.badRequest(messages.REVIEW.ALREADY_HAVE_REVIEW);
        }
        throw error;
    }

}

export async function updateReview(params: { reviewId: string, buyerId: string, rating?: number, comment?: string }): Promise<PublicReview> {

    const reviewId = ensureObjectId(params.reviewId, messages.COMMON.INVALID_REVIEW);
    const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);

    const review = await Review.findOne({ _id: reviewId, buyerId }).exec();

    if (!review) throw ApiError.notFound(messages.COMMON.REVIEW_NOT_FOUND);

    if (params.rating !== undefined) review.rating = params.rating;
    if (params.comment !== undefined) review.comment = params.comment;

    const updatedReview = await review.save();

    await updateProductRatingStats(review.productId);

    const product = await Product.findById(review.productId).lean().exec();
    if (!product) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);

    await Notification.create({
        userId: product.sellerId,
        title: `Review Updated (${review._id})`,
        message: `Your review for product ${review.productId} has been updated by User.`
    });

    return toPublicReview(updatedReview);
}

export async function deleteReview(params: { reviewId: string, buyerId: string }): Promise<PublicReview> {
    const reviewId = ensureObjectId(params.reviewId, messages.COMMON.INVALID_REVIEW);
    const buyerId = ensureObjectId(params.buyerId, messages.COMMON.INVALID_BUYER);

    const review = await Review.findOne({ _id: reviewId, buyerId }).exec();

    if (!review) throw ApiError.notFound(messages.COMMON.REVIEW_NOT_FOUND);

    await Review.deleteOne({ _id: reviewId }).exec();

    await updateProductRatingStats(review.productId);

    const product = await Product.findById(review.productId).lean().exec();
    if (!product) throw ApiError.notFound(messages.COMMON.PRODUCT_NOT_FOUND);

    await Notification.create({
        userId: product.sellerId,
        title: `Review Deleted (${review._id})`,
        message: `Your review for product ${review.productId} has been deleted by User.`
    });

    return toPublicReview(review);
}