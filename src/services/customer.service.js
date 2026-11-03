const AppError = require('../utils/AppError');
const customerRepository = require('../repositories/customer.repository');

const getAllCustomers = async (tenantId) => {
  return await customerRepository.findAllByTenant(tenantId);
};

const getCustomerById = async (id, tenantId) => {
  const customer = await customerRepository.findByIdAndTenant(id, tenantId);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return customer;
};

const createCustomer = async ({ name, email, phone, nationalId }, tenantId) => {
  const existingCustomer = await customerRepository.findByEmailAndTenant(
    email,
    tenantId
  );

  if (existingCustomer) {
    throw new AppError('Customer with this email already exists', 409);
  }

  return await customerRepository.create({
    tenantId,
    name,
    email,
    phone,
    nationalId,
  });
};

const updateCustomer = async (id, updates, tenantId) => {
  const existingCustomer = await customerRepository.findByIdAndTenant(
    id,
    tenantId
  );
  if (!existingCustomer) {
    throw new AppError('Customer not found', 404);
  }

  if (updates.email) {
    const emailOwner = await customerRepository.findByEmailAndTenant(
      updates.email,
      tenantId
    );
    if (emailOwner && emailOwner.id !== id) {
      throw new AppError('Customer with this email already exists', 409);
    }
  }

  return await customerRepository.updateByIdAndTenant(id, tenantId, updates);
};

const deleteCustomer = async (id, tenantId) => {
  const deleted = await customerRepository.deleteByIdAndTenant(id, tenantId);
  if (!deleted) {
    throw new AppError('Customer not found', 404);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};