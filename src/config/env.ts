import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

/** Comma-separated allowed origins; omit or empty → reflect request Origin. */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(3000),
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  CORS_ORIGINS: Joi.string().optional().allow(""),
})
  // process.env includes many OS-provided variables; validate only the keys we declare.
  .unknown(true)
  .messages({
    "object.unknown": "{{#label}} is not allowed",
  });

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
  stripUnknown: true,
});

if (error) {
  const details = error.details.map((d) => d.message).join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

const raw = value as {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  CORS_ORIGINS?: string;
};

const corsOriginsList =
  raw.CORS_ORIGINS && raw.CORS_ORIGINS.trim().length > 0
    ? raw.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : null;

export const env = {
  NODE_ENV: raw.NODE_ENV,
  PORT: raw.PORT,
  MONGODB_URI: raw.MONGODB_URI,
  JWT_SECRET: raw.JWT_SECRET,
  CORS_ORIGINS: corsOriginsList,
};
