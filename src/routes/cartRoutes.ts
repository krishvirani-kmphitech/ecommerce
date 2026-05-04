import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validateRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as cartController from "../controllers/cartController.js";
import { addCartItemSchema, updateCartItemSchema } from "../validators/cartValidators.js";

export const cartRouter = Router();

cartRouter.get("/", requireAuth, requireRole("buyer"), asyncHandler(cartController.getMyCart));
cartRouter.post("/items", requireAuth, requireRole("buyer"), validateBody(addCartItemSchema), asyncHandler(cartController.addItem));
cartRouter.patch(
  "/items/:productId",
  requireAuth,
  requireRole("buyer"),
  validateBody(updateCartItemSchema),
  asyncHandler(cartController.updateItem),
);
cartRouter.delete("/items/:productId", requireAuth, requireRole("buyer"), asyncHandler(cartController.removeItem));

