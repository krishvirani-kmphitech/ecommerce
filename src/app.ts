import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { authRouter } from "./routes/authRoutes.js";
import { cartRouter } from "./routes/cartRoutes.js";
import { orderRouter } from "./routes/orderRoutes.js";
import { categoriesRouter } from "./routes/categoryRoutes.js";
import { productsRouter } from "./routes/productRoutes.js";
import { returnRouter } from "./routes/returnRoutes.js";
import { reviewRouter } from "./routes/reviewRoutes.js";
import { addressRouter } from "./routes/addressRoutes.js";
import { notificationRouter } from "./routes/notificationRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { ApiError } from "./utils/ApiError.js";
import { logger } from "./utils/logger.js";

export function createApp(): express.Application {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin:
        env.CORS_ORIGINS !== null && env.CORS_ORIGINS.length > 0
          ? env.CORS_ORIGINS
          : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: express.Request) => req.url === "/health",
      },
    }),
  );

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === "production" ? 200 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(apiLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/addresses", addressRouter);
  app.use("/categories", categoriesRouter);
  app.use("/cart", cartRouter);
  app.use("/orders", orderRouter);
  app.use("/products", productsRouter);
  app.use("/returns", returnRouter);
  app.use("/reviews", reviewRouter);
  app.use("/notifications", notificationRouter);

  app.use((_req, _res, next) => {
    next(ApiError.notFound("Route not found"));
  });

  app.use(errorHandler);

  return app;
}
