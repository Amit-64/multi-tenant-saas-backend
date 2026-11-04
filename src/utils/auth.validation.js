const Joi = require('joi');

const registerSchema = Joi.object({
  tenantName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(72).required(),
});

const loginSchema = Joi.object({
  tenantId: Joi.string().uuid().required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().trim().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};