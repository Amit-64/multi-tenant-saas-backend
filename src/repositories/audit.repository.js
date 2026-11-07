const crypto = require('crypto');
const db = require('../config/db');

const GENESIS_HASH = '0'.repeat(64);

const computeAuditHash = ({
  tenantId,
  actorId,
  action,
  resource,
  resourceId,
  payload,
  prevHash,
}) => {
  const serializedPayload = JSON.stringify(payload || {});
  const dataToHash = `${tenantId}|${actorId || 'SYSTEM'}|${action}|${resource}|${resourceId || 'NONE'}|${serializedPayload}|${prevHash}`;
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
};

const createAuditLog = async ({
  tenantId,
  actorId = null,
  action,
  resource,
  resourceId = null,
  payload = {},
  ipAddress = null,
}) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');


    const prevQuery = `
      SELECT curr_hash AS "currHash"
      FROM audit_logs
      WHERE tenant_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      FOR UPDATE
    `;
    const { rows: prevRows } = await client.query(prevQuery, [tenantId]);
    const prevHash = prevRows[0] ? prevRows[0].currHash : GENESIS_HASH;

   
    const currHash = computeAuditHash({
      tenantId,
      actorId,
      action,
      resource,
      resourceId,
      payload,
      prevHash,
    });


    const insertQuery = `
      INSERT INTO audit_logs (
        tenant_id,
        actor_id,
        action,
        resource,
        resource_id,
        payload,
        ip_address,
        prev_hash,
        curr_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id,
                tenant_id AS "tenantId",
                actor_id AS "actorId",
                action,
                resource,
                resource_id AS "resourceId",
                payload,
                ip_address AS "ipAddress",
                prev_hash AS "prevHash",
                curr_hash AS "currHash",
                created_at AS "createdAt"
    `;

    const { rows } = await client.query(insertQuery, [
      tenantId,
      actorId,
      action,
      resource,
      resourceId,
      payload,
      ipAddress,
      prevHash,
      currHash,
    ]);

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findAllByTenant = async ({
  tenantId,
  resource = null,
  action = null,
  limit = 20,
  offset = 0,
}) => {
  const query = `
    SELECT a.id,
           a.tenant_id AS "tenantId",
           a.actor_id AS "actorId",
           u.email AS "actorEmail",
           a.action,
           a.resource,
           a.resource_id AS "resourceId",
           a.payload,
           a.ip_address AS "ipAddress",
           a.prev_hash AS "prevHash",
           a.curr_hash AS "currHash",
           a.created_at AS "createdAt"
    FROM audit_logs a
    LEFT JOIN users u ON a.actor_id = u.id
    WHERE a.tenant_id = $1
      AND ($2::varchar IS NULL OR a.resource = $2)
      AND ($3::varchar IS NULL OR a.action = $3)
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT $4 OFFSET $5
  `;

  const { rows } = await db.query(query, [
    tenantId,
    resource,
    action,
    limit,
    offset,
  ]);
  return rows;
};
const findAllByTenantChronological = async (tenantId) => {
    const query = `
      SELECT id,
             tenant_id AS "tenantId",
             actor_id AS "actorId",
             action,
             resource,
             resource_id AS "resourceId",
             payload,
             ip_address AS "ipAddress",
             prev_hash AS "prevHash",
             curr_hash AS "currHash",
             created_at AS "createdAt"
      FROM audit_logs
      WHERE tenant_id = $1
      ORDER BY created_at ASC, id ASC
    `;
    const { rows } = await db.query(query, [tenantId]);
    return rows;
  };
  
  module.exports = {
    GENESIS_HASH,
    computeAuditHash,
    createAuditLog,
    findAllByTenant,
    findAllByTenantChronological,
  };
