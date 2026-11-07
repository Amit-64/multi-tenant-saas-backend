const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(72).required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'VIEWER').default('VIEWER'),
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('ADMIN', 'MANAGER', 'VIEWER').required(),
});

module.exports = {
  createUserSchema,
  updateUserRoleSchema,
};