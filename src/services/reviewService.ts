import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Review, ReviewDoc } from "../models/Review.js";
import { Order } from "../models/Order.js";
import { Notification } from "../models/Notification.js";
import { Product } from "../models/Product.js";

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

export async function createReview(params: { orderId: string, productId: string, buyerId: string, rating: number, comment?: string }): Promise<PublicReview> {

    const orderId = ensureObjectId(params.orderId, "Invalid order id");
    const productId = ensureObjectId(params.productId, "Invalid product id");
    const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");

    const orderExist = await Order.findOne({ _id: orderId, productId, buyerId, status: { $in: ["DELIVERED", "ACCEPTED", "RETURNED"] } });

    if (!orderExist) throw ApiError.badRequest("Order not found or not eligible for review");

    try {

        const review = await Review.create({
            orderId,
            productId,
            buyerId,
            rating: params.rating,
            comment: params.comment || "",
        });

        await Notification.create({
            userId: orderExist.sellerId,
            title: `New Review for ${orderExist.productId}`,
            message: `A new review has been submitted for your product.`
        });

        return toPublicReview(review);

    } catch (error) {
        if (isMongoDuplicateError(error)) {
            throw ApiError.badRequest("You have already reviewed this product");
        }
        throw error;
    }

}

export async function updateReview(params: { reviewId: string, buyerId: string, rating?: number, comment?: string }): Promise<PublicReview> {

    const reviewId = ensureObjectId(params.reviewId, "Invalid review id");
    const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");

    const review = await Review.findOne({ _id: reviewId, buyerId }).exec();

    if (!review) throw ApiError.notFound("Review not found");

    if (params.rating !== undefined) review.rating = params.rating;
    if (params.comment !== undefined) review.comment = params.comment;

    const updatedReview = await review.save();

    const product = await Product.findById(review.productId).lean().exec();
    if (!product) throw ApiError.notFound("Product not found");

    await Notification.create({
        userId: product.sellerId,
        title: `Review Updated (${review._id})`,
        message: `Your review for product ${review.productId} has been updated by User.`
    });

    return toPublicReview(updatedReview);
}

export async function deleteReview(params: { reviewId: string, buyerId: string }): Promise<PublicReview> {
    const reviewId = ensureObjectId(params.reviewId, "Invalid review id");
    const buyerId = ensureObjectId(params.buyerId, "Invalid buyer id");

    const review = await Review.findOne({ _id: reviewId, buyerId }).exec();

    if (!review) throw ApiError.notFound("Review not found");

    await Review.deleteOne({ _id: reviewId }).exec();

    const product = await Product.findById(review.productId).lean().exec();
    if (!product) throw ApiError.notFound("Product not found");

    await Notification.create({
        userId: product.sellerId,
        title: `Review Deleted (${review._id})`,
        message: `Your review for product ${review.productId} has been deleted by User.`
    });

    return toPublicReview(review);
}