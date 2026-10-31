const Joi = require('joi');

const createCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': "'phone' must contain 10 to 15 digits",
    }),
  nationalId: Joi.string().trim().alphanum().min(5).max(20).required(),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email(),
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .messages({
      'string.pattern.base': "'phone' must contain 10 to 15 digits",
    }),
  nationalId: Joi.string().trim().alphanum().min(5).max(20),
}).min(1);

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};