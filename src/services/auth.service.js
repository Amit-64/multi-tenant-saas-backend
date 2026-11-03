const AppError = require('../utils/AppError');
const authRepository = require('../repositories/auth.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken } = require('../utils/jwt');

const registerTenantAdmin = async ({ tenantName, email, password }) => {
  const passwordHash = await hashPassword(password);

  const result = await authRepository.createTenantWithAdmin({
    tenantName,
    email,
    passwordHash,
  });

  return result;
};

const login = async ({ tenantId, email, password }) => {
  const user = await authRepository.findUserByEmailAndTenant(email, tenantId);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError('User account is not active', 403);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    tenantId: user.tenantId,
    roles: user.roles,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      status: user.status,
      roles: user.roles,
    },
  };
};

module.exports = {
  registerTenantAdmin,
  login,
};
