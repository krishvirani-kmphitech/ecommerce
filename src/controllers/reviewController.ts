import { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import * as reviewService from "../services/reviewService.js";
import { messages } from "../constants/messages.js";

export async function createReview(req: Request, res: Response): Promise<void> {

    const { orderId, productId, rating, comment } = req.body;
    const buyerId = req.user?.id;
    if (!buyerId) throw ApiError.unauthorized();

    const result = await reviewService.createReview({ orderId, productId, buyerId, rating, comment });
    sendSuccess(res, { statusCode: 201, message: messages.REVIEW.ADDED_SUCCESS, data: result });

}

export async function updateReview(req: Request, res: Response): Promise<void> {

    const { reviewId, rating, comment } = req.body;
    const buyerId = req.user?.id;
    if (!buyerId) throw ApiError.unauthorized();

    const result = await reviewService.updateReview({ reviewId, buyerId, rating, comment });
    sendSuccess(res, { message: messages.REVIEW.UPDATE_SUCCESS, data: result });
}

export async function deleteReview(req: Request, res: Response): Promise<void> {

    const { reviewId } = req.body;
    const buyerId = req.user?.id;
    if (!buyerId) throw ApiError.unauthorized();

    const result = await reviewService.deleteReview({ reviewId, buyerId });
    sendSuccess(res, { message: messages.REVIEW.DELTED_SUCCESS, data: result });
}