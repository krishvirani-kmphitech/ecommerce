import Joi from "joi";

export const listOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).required();

export const checkoutSchema = Joi.object({
  primaryAddress: Joi.boolean().required(),
  address: Joi.object({
    street: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    zip: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
  }).optional(),
}).required();
