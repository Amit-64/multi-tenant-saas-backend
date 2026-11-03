const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is missing or malformed', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token is missing', 401);
    }

    const decoded = verifyAccessToken(token);


    req.user = {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      roles: decoded.roles || [],
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token has expired', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid access token', 401));
    }
    next(err);
  }
};

module.exports = {
  authenticate,
};