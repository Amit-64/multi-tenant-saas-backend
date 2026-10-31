const customerService = require('../services/customer.service');

const getAllCustomers = (req, res, next) => {
  try {
    const data = customerService.getAllCustomers();
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getCustomerById = (req, res, next) => {
  try {
    const customer = customerService.getCustomerById(req.params.id);
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

const createCustomer = (req, res, next) => {
  try {
    const customer = customerService.createCustomer(req.body);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

const updateCustomer = (req, res, next) => {
  try {
    const customer = customerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCustomer = (req, res, next) => {
  try {
    customerService.deleteCustomer(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};