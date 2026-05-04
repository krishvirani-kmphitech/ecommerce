import Joi from "joi";

export const addCartItemSchema = Joi.object({
  productId: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).required(),
}).required();

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
}).required();

