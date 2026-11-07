const customerService = require('../services/customer.service');
const auditService = require('../services/audit.service');

const getAllCustomers = async (req, res, next) => {
  try {
    const data = await customerService.getAllCustomers(req.user.tenantId);
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const data = await customerService.getCustomerById(
      req.params.id,
      req.user.tenantId
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const data = await customerService.createCustomer(
      req.body,
      req.user.tenantId
    );

    await auditService.logEvent({
      tenantId: req.user.tenantId,
      actorId: req.user.userId,
      action: 'CUSTOMER_CREATED',
      resource: 'customers',
      resourceId: data.id,
      payload: { name: data.name, email: data.email, status: data.status },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const data = await customerService.updateCustomer(
      req.params.id,
      req.body,
      req.user.tenantId
    );

    await auditService.logEvent({
      tenantId: req.user.tenantId,
      actorId: req.user.userId,
      action: 'CUSTOMER_UPDATED',
      resource: 'customers',
      resourceId: data.id,
      payload: { updatedFields: req.body },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id, req.user.tenantId);

    await auditService.logEvent({
      tenantId: req.user.tenantId,
      actorId: req.user.userId,
      action: 'CUSTOMER_DELETED',
      resource: 'customers',
      resourceId: req.params.id,
      payload: { deletedCustomerId: req.params.id },
      ipAddress: req.ip,
    });

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