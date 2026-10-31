const express = require('express');
const customerController = require('../controllers/customer.controller');
const validate = require('../middleware/validate');
const {createCustomerSchema , updateCustomerSchema} = require('../utils/customer.validation');

const router = express.Router();

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/',validate(createCustomerSchema), customerController.createCustomer);
router.patch('/:id',validate(updateCustomerSchema),customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;