import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as checkoutController from "../controllers/checkoutController.js";

export const checkoutRouter = Router();

checkoutRouter.post("/", requireAuth, requireRole("buyer"), asyncHandler(checkoutController.checkout));

