const express = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(authenticate);
router.use(requirePermission('audit:read'));

router.get('/', auditController.getAuditLogs);
router.get('/verify', auditController.verifyAuditChain);

module.exports = router;