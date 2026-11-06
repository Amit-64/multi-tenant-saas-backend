const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = ({ userId, tenantId, roles=[],permissions =[]}) => {
  return jwt.sign(
    {
      sub: userId,
      tenantId,
      roles,
      permissions,
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn,
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.accessSecret);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};