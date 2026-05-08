import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody, validateQuery } from "../middlewares/validateRequest.js";
import * as productController from "../controllers/productController.js";
import { createProductSchema, getPublicByIdSchema, listPublicQuerySchema, updateProductSchema } from "../validators/productValidators.js";

export const productsRouter = Router();

// Seller-only
productsRouter.get("/mine", requireAuth, requireRole("seller"), validateQuery(listPublicQuerySchema), asyncHandler(productController.listMine));
productsRouter.post("/", requireAuth, requireRole("seller"), validateBody(createProductSchema), asyncHandler(productController.create));
productsRouter.patch("/:id", requireAuth, requireRole("seller"), validateBody(updateProductSchema), asyncHandler(productController.update));
productsRouter.patch("/:productId/disable", requireAuth, requireRole("seller"), asyncHandler(productController.disable));
productsRouter.patch("/:productId/active", requireAuth, requireRole("seller"), asyncHandler(productController.active));
productsRouter.delete("/:id", requireAuth, requireRole("seller"), asyncHandler(productController.remove));

// Public catalog
productsRouter.get("/", validateQuery(listPublicQuerySchema), asyncHandler(productController.listPublic));
// productsRouter.get("/category/:categoryId", asyncHandler(productController.listPublicByCategory));
productsRouter.get("/:slug", validateQuery(getPublicByIdSchema), asyncHandler(productController.getPublicById));

