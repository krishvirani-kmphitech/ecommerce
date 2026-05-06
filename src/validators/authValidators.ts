import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(2).max(72).required(),
  role: Joi.string().valid("buyer", "seller").required(),
}).required();

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).max(72).required(),
}).required();

export const addAddressSchema = Joi.object({
  street: Joi.string().trim().min(5).max(200).required(),
  city: Joi.string().trim().min(2).max(50).required(),
  state: Joi.string().trim().min(2).max(50).required(),
  zip: Joi.string().trim().min(2).max(20).required(),
  country: Joi.string().trim().min(2).max(50).required(),
}).required();

export const setPrimaryAddressSchema = Joi.object({
  addressId: Joi.string().hex().length(24).required(),
}).required();

