const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');


const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true, 
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Too many requests from this IP, please try again after 15 minutes',
        429
      )
    );
  },
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        'Too many authentication attempts from this IP, please try again after 15 minutes',
        429
      )
    );
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};