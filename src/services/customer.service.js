const crypto = require('crypto');
const AppError = require('../utils/AppError');

const customers = [];

const getAllCustomers = () => {
  return customers;
};

const getCustomerById = (id) => {
  const customer = customers.find((item) => item.id === id);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return customer;
};

const createCustomer = ({ name, email, phone, nationalId }) => {
  const existingCustomer = customers.find(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  );

  if (existingCustomer) {
    throw new AppError('Customer with this email already exists', 409);
  }

  const newCustomer = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    phone,
    nationalId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  customers.push(newCustomer);
  return newCustomer;
};

const updateCustomer = (id, updates) => {
  const index = customers.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new AppError('Customer not found', 404);
  }

  if (updates.email) {
    const emailTaken = customers.find(
      (item) =>
        item.email.toLowerCase() === updates.email.toLowerCase() &&
        item.id !== id
    );
    if (emailTaken) {
      throw new AppError('Customer with this email already exists', 409);
    }
    updates.email = updates.email.toLowerCase();
  }

  customers[index] = {
    ...customers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return customers[index];
};

const deleteCustomer = (id) => {
  const index = customers.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new AppError('Customer not found', 404);
  }

  customers.splice(index, 1);
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};