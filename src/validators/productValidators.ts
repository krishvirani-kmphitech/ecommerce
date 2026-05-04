import Joi from "joi";

export const createProductSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  category: Joi.string().trim().min(1).max(64).required(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(0).required(),
}).required();

export const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  category: Joi.string().trim().min(1).max(64).optional(),
  price: Joi.number().min(0).optional(),
  quantity: Joi.number().integer().min(0).optional(),
})
  .min(1)
  .required();

