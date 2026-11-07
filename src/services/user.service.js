const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');
const authRepository = require('../repositories/auth.repository');
const { hashPassword } = require('../utils/password');

const getAllUsers = async (tenantId) => {
  return await userRepository.findAllByTenant(tenantId);
};

const createUser = async ({ email, password, role = 'VIEWER' }, tenantId) => {
  const existingUser = await authRepository.findUserByEmailAndTenant(
    email,
    tenantId
  );

  if (existingUser) {
    throw new AppError('User with this email already exists in this tenant', 409);
  }

  
  const passwordHash = await hashPassword(password);

  return await userRepository.createUserWithRole({
    tenantId,
    email,
    passwordHash,
    roleName: role,
  });
};

const updateUserRole = async ({
  targetUserId,
  roleName,
  tenantId,
  requestingUserId,
}) => {
  if (targetUserId === requestingUserId) {
    throw new AppError('You cannot modify your own role', 400);
  }

  const targetUser = await userRepository.findByIdAndTenant(
    targetUserId,
    tenantId
  );
  if (!targetUser) {
    throw new AppError('User not found in this tenant', 404);
  }

  await userRepository.updateUserRole({
    userId: targetUserId,
    tenantId,
    roleName,
  });

  
  await authRepository.revokeAllUserRefreshTokens(targetUserId);

  return await userRepository.findByIdAndTenant(targetUserId, tenantId);
};

module.exports = {
  getAllUsers,
  createUser,
  updateUserRole,
};