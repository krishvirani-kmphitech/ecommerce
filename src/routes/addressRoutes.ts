import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validateRequest.js";
import * as addressController from "../controllers/addressController.js";
import { addAddressSchema, setPrimaryAddressSchema } from "../validators/authValidators.js";

export const addressRouter = Router();

// Get all addresses for the user
addressRouter.get("/", requireAuth, asyncHandler(addressController.getAddresses));

// Add a new address
addressRouter.post("/", requireAuth, validateBody(addAddressSchema), asyncHandler(addressController.addAddress));

// Set primary address
addressRouter.patch("/primary", requireAuth, validateBody(setPrimaryAddressSchema), asyncHandler(addressController.setPrimaryAddress));

// Delete an address
addressRouter.delete("/:id", requireAuth, asyncHandler(addressController.deleteAddress));
