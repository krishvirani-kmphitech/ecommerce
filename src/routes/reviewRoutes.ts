import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as reviewController from "../controllers/reviewController.js";
import { validateBody } from "../middlewares/validateRequest.js";
import { createReviewSchema, deleteReviewSchema, updateReviewSchema } from "../validators/reviewValidators.js";

export const reviewRouter = Router();

reviewRouter.post("/", requireAuth, requireRole("buyer"), validateBody(createReviewSchema), asyncHandler(reviewController.createReview));
reviewRouter.patch("/", requireAuth, requireRole("buyer"), validateBody(updateReviewSchema), asyncHandler(reviewController.updateReview));
reviewRouter.delete("/", requireAuth, requireRole("buyer"), validateBody(deleteReviewSchema), asyncHandler(reviewController.deleteReview));
