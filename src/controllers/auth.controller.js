const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const data = await authService.registerTenantAdmin(req.body);
    res.status(201).json({
      success: true,
      message: 'Tenant and admin user registered successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
};