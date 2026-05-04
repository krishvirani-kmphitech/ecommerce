import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validateRequest.js";
import * as productController from "../controllers/productController.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidators.js";

export const productsRouter = Router();

// Seller-only
productsRouter.get("/mine", requireAuth, requireRole("seller"), asyncHandler(productController.listMine));
productsRouter.post("/", requireAuth, requireRole("seller"), validateBody(createProductSchema), asyncHandler(productController.create));
productsRouter.patch("/:id", requireAuth, requireRole("seller"), validateBody(updateProductSchema), asyncHandler(productController.update));
productsRouter.delete("/:id", requireAuth, requireRole("seller"), asyncHandler(productController.remove));

// Public catalog
productsRouter.get("/", asyncHandler(productController.listPublic));
productsRouter.get("/category/:category", asyncHandler(productController.listPublicByCategory));
productsRouter.get("/:id", asyncHandler(productController.getPublicById));

