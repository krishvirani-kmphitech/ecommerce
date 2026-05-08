import Joi from "joi";

const objectIdString = Joi.string().hex().length(24).required();

export const listPublicQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  categoryId: Joi.string().hex().length(24).optional(),
}).required();

export const createProductSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  categoryId: objectIdString,
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(0).required(),
}).required();

export const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  categoryId: Joi.string().hex().length(24).optional(),
  price: Joi.number().min(0).optional(),
  quantity: Joi.number().integer().min(0).optional(),
})
  .min(1)
  .required();

export const getPublicByIdSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).required();