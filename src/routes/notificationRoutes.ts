import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationController from "../controllers/notificationController.js"

export const notificationRouter = Router();

notificationRouter.get("/", requireAuth, asyncHandler(notificationController.getNotification));