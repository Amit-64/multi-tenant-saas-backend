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

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data,
    });
  } catch (err) {
    next(err);
  }
};
const refresh = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body);
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  getMe
};