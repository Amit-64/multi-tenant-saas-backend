const express = require('express');
const customerController = require('../controllers/customer.controller');
const validate = require('../middleware/validate');
const {createCustomerSchema , updateCustomerSchema} = require('../utils/customer.validation');
const {requirePermission}= require('../middleware/rbac.middleware');
const {authenticate}  = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/',requirePermission('customers:read'),customerController.getAllCustomers);
router.get('/:id',requirePermission('customers:read'), customerController.getCustomerById);
router.post('/',requirePermission('customers:create'),validate(createCustomerSchema), customerController.createCustomer);
router.patch('/:id',requirePermission('customers:update'),validate(updateCustomerSchema),customerController.updateCustomer);
router.delete('/:id',requirePermission('customers:delete'), customerController.deleteCustomer);

module.exports = router;