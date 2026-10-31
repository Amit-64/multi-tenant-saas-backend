const env = require("../config/env");
const AppError = require("../utils/AppError");

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal Server Error";

  if (statusCode === 500) {
    console.error(`[ERROR]`, err);
  }

  const response = {
    success: false,
    message,
  };

  if (env.nodeEnv === `development` && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
