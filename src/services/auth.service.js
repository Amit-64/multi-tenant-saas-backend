const AppError = require('../utils/AppError');
const authRepository = require('../repositories/auth.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken } = require('../utils/jwt');
const { generateRefreshToken, hashToken } = require('../utils/token');

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

  const { rawToken: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

  await authRepository.saveRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      status: user.status,
      roles: user.roles,
    },
  };
};

const refresh = async ({ refreshToken }) => {
  const incomingTokenHash = hashToken(refreshToken);
  const storedToken = await authRepository.findRefreshTokenByHash(
    incomingTokenHash
  );

  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  
  if (storedToken.revokedAt) {
    await authRepository.revokeAllUserRefreshTokens(storedToken.userId);
    throw new AppError(
      'Refresh token reuse detected. All sessions have been revoked for security.',
      401
    );
  }

  if (new Date() > new Date(storedToken.expiresAt)) {
    await authRepository.revokeRefreshTokenById(storedToken.id);
    throw new AppError('Refresh token has expired', 401);
  }

  const user = await authRepository.findUserById(storedToken.userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError('User account is not active', 403);
  }

  await authRepository.revokeRefreshTokenById(storedToken.id);


  const newAccessToken = generateAccessToken({
    userId: user.id,
    tenantId: user.tenantId,
    roles: user.roles,
  });

  const {
    rawToken: newRefreshToken,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
  } = generateRefreshToken();

  await authRepository.saveRefreshToken({
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

module.exports = {
  registerTenantAdmin,
  login,
  refresh,
};