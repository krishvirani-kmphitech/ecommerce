import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validateRequest.js";
import * as addressController from "../controllers/addressController.js";
import { addAddressSchema } from "../validators/authValidators.js";

export const addressRouter = Router();

// Get all addresses for the user
addressRouter.get("/", requireAuth, asyncHandler(addressController.getAddresses));

// Get primary address
addressRouter.get("/primary", requireAuth, asyncHandler(addressController.getPrimaryAddress))

// Add a new address
addressRouter.post("/", requireAuth, validateBody(addAddressSchema), asyncHandler(addressController.addAddress));

// Set primary address
addressRouter.patch("/:id/primary", requireAuth, asyncHandler(addressController.setPrimaryAddress));

// Delete an address
addressRouter.delete("/:id", requireAuth, asyncHandler(addressController.deleteAddress));
