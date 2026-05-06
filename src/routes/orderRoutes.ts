import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateQuery } from "../middlewares/validateRequest.js";
import * as orderController from "../controllers/orderController.js";
import { listOrdersQuerySchema } from "../validators/orderValidators.js";

export const orderRouter = Router();

// for seller
orderRouter.get("/seller", requireAuth, requireRole("seller"), validateQuery(listOrdersQuerySchema), asyncHandler(orderController.getSellerOrder));
orderRouter.patch("/:orderId/reject", requireAuth, requireRole("seller"), asyncHandler(orderController.rejectOrderBySeller));
orderRouter.patch("/:orderId/out-for-delivery", requireAuth, requireRole("seller"), asyncHandler(orderController.outForDeliveryOrder));

// buyer
orderRouter.get("/", requireAuth, requireRole("buyer"), validateQuery(listOrdersQuerySchema), asyncHandler(orderController.getMyOrders));
orderRouter.get("/:orderId", requireAuth, requireRole("buyer"), asyncHandler(orderController.getMyOrderDetails));

orderRouter.patch("/:orderId/cancel", requireAuth, requireRole("buyer"), asyncHandler(orderController.cancelOrder));