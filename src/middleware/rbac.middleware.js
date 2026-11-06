const AppError = require('../utils/AppError');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.roles)) {
      return next(new AppError('Authentication required', 401));
    }

    const hasRole = allowedRoles.some((role) => req.user.roles.includes(role));

    if (!hasRole) {
      return next(
        new AppError(
          `Forbidden: requires one of the following roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};


const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.permissions)) {
      return next(new AppError('Authentication required', 401));
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      req.user.permissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return next(
        new AppError(
          `Forbidden: missing required permission (${requiredPermissions.join(', ')})`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission,
};