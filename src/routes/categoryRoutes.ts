import { Router } from "express";
import * as categoryController from "../controllers/categoryController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCategorySchema } from "../validators/categoryValidators.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", asyncHandler(categoryController.list));
categoriesRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateBody(createCategorySchema),
  asyncHandler(categoryController.create),
);
