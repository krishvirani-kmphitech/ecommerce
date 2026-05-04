import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validateRequest.js";
import { loginSchema, registerSchema } from "../validators/authValidators.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), asyncHandler(authController.register));

authRouter.post("/login", validateBody(loginSchema), asyncHandler(authController.login));

authRouter.get("/me", requireAuth, asyncHandler(authController.me));

