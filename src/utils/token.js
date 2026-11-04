const crypto = require('crypto');
const env = require('../config/env');

const generateRefreshToken = () => {
  
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.jwt.refreshExpiresDays);

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
};

const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

module.exports = {
  generateRefreshToken,
  hashToken,
};