const auditService = require('../services/audit.service');

const getAuditLogs = async (req, res, next) => {
  try {
    const { resource, action, page, limit } = req.query;
    const data = await auditService.getAuditLogs({
      tenantId: req.user.tenantId,
      resource,
      action,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
};

const verifyAuditChain = async (req, res, next) => {
  try {
    const verification = await auditService.verifyTenantAuditChain(
      req.user.tenantId
    );

    res.status(200).json({
      success: true,
      data: verification,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs,
  verifyAuditChain,
};