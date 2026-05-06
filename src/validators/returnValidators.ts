import Joi from "joi";

export const createReturnSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  reason: Joi.string().min(10).max(500).required(),
}).required();

export const rejectReturnSchema = Joi.object({
  notes: Joi.string().min(0).max(500).optional(),
}).required();
