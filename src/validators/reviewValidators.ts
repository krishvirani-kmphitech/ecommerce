import Joi from "joi";

export const createReviewSchema = Joi.object({
    orderId: Joi.string().hex().length(24).required(),
    productId: Joi.string().hex().length(24).required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().min(5).max(500).optional()
}).required();

export const updateReviewSchema = Joi.object({
    reviewId: Joi.string().hex().length(24).required(),
    rating: Joi.number().min(1).max(5).optional(),
    comment: Joi.string().min(5).max(500).optional()
}).required();

export const deleteReviewSchema = Joi.object({
    reviewId: Joi.string().hex().length(24).required(),
}).required();