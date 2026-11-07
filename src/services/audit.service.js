const auditRepository = require('../repositories/audit.repository');

const logEvent = async ({
  tenantId,
  actorId = null,
  action,
  resource,
  resourceId = null,
  payload = {},
  ipAddress = null,
}) => {
  return await auditRepository.createAuditLog({
    tenantId,
    actorId,
    action,
    resource,
    resourceId,
    payload,
    ipAddress,
  });
};

const getAuditLogs = async ({
  tenantId,
  resource = null,
  action = null,
  page = 1,
  limit = 20,
}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const logs = await auditRepository.findAllByTenant({
    tenantId,
    resource,
    action,
    limit: safeLimit,
    offset,
  });

  return {
    page: safePage,
    limit: safeLimit,
    count: logs.length,
    logs,
  };
};

const verifyTenantAuditChain = async (tenantId) => {
  const logs = await auditRepository.findAllByTenantChronological(tenantId);

  let expectedPrevHash = auditRepository.GENESIS_HASH;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];


    if (log.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalChecked: i + 1,
        brokenAtLogId: log.id,
        reason: 'prev_hash mismatch (possible deleted or reordered row)',
      };
    }


    const recomputedHash = auditRepository.computeAuditHash({
      tenantId: log.tenantId,
      actorId: log.actorId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      payload: log.payload,
      prevHash: log.prevHash,
    });

    if (log.currHash !== recomputedHash) {
      return {
        valid: false,
        totalChecked: i + 1,
        brokenAtLogId: log.id,
        reason: 'curr_hash mismatch (row payload or metadata was modified)',
      };
    }

    expectedPrevHash = log.currHash;
  }

  return {
    valid: true,
    totalLogsVerified: logs.length,
    latestHash: expectedPrevHash,
  };
};

module.exports = {
  logEvent,
  getAuditLogs,
  verifyTenantAuditChain,
};