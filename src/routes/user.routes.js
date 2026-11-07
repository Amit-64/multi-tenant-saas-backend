const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  createUserSchema,
  updateUserRoleSchema,
} = require('../utils/user.validation');

const router = express.Router();


router.use(authenticate);
router.use(requirePermission('users:manage'));

router.get('/', userController.getAllUsers);
router.post('/', validate(createUserSchema), userController.createUser);
router.patch(
  '/:id/role',
  validate(updateUserRoleSchema),
  userController.updateUserRole
);

module.exports = router;