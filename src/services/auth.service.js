const authRepository = require('../repositories/auth.repository');
const { hashPassword } = require('../utils/password');

const registerTenantAdmin = async ({ tenantName, email, password }) => {
  
  const passwordHash = await hashPassword(password);

  const result = await authRepository.createTenantWithAdmin({
    tenantName,
    email,
    passwordHash,
  });

  return result;
};

module.exports = {
  registerTenantAdmin,
};