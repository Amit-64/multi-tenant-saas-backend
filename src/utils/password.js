const bcrypt = require('bcryptjs');
const env = require('../config/env');

const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, env.bcryptSaltRounds);
};

const comparePassword = async (plainPassword, passwordHash) => {
  return await bcrypt.compare(plainPassword, passwordHash);
};

module.exports = {
  hashPassword,
  comparePassword,
};