import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validateRequest.js";
import * as returnController from "../controllers/returnController.js";
import { createReturnSchema, rejectReturnSchema } from "../validators/returnValidators.js";

export const returnRouter = Router();

// buyer - create return request
returnRouter.post("/", requireAuth, requireRole("buyer"), validateBody(createReturnSchema), asyncHandler(returnController.createReturn));

// buyer - get all returns
returnRouter.get("/", requireAuth, asyncHandler(returnController.getReturns));

// buyer/seller - get single return
returnRouter.get("/:id", requireAuth, asyncHandler(returnController.getReturn));

// seller - approve return
returnRouter.patch("/:id/approve", requireAuth, requireRole("seller"), asyncHandler(returnController.approveReturn));

// seller - reject return
returnRouter.patch("/:id/reject", requireAuth, requireRole("seller"), validateBody(rejectReturnSchema), asyncHandler(returnController.rejectReturn));
