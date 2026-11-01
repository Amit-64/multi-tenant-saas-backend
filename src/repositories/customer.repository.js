const db = require('../config/db');

const findAllByTenant = async (tenantId) => {
  const query = `
    SELECT id, tenant_id AS "tenantId", name, email, phone, national_id AS "nationalId",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM customers
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await db.query(query, [tenantId]);
  return rows;
};

const findByIdAndTenant = async (id, tenantId) => {
  const query = `
    SELECT id, tenant_id AS "tenantId", name, email, phone, national_id AS "nationalId",
           created_at AS "createdAt", updated_at AS "updatedAt"
    FROM customers
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rows } = await db.query(query, [id, tenantId]);
  return rows[0] || null;
};

const findByEmailAndTenant = async (email, tenantId) => {
  const query = `
    SELECT id, tenant_id AS "tenantId", name, email, phone, national_id AS "nationalId"
    FROM customers
    WHERE LOWER(email) = LOWER($1) AND tenant_id = $2
  `;
  const { rows } = await db.query(query, [email, tenantId]);
  return rows[0] || null;
};

const create = async ({ tenantId, name, email, phone, nationalId }) => {
  const query = `
    INSERT INTO customers (tenant_id, name, email, phone, national_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, tenant_id AS "tenantId", name, email, phone, national_id AS "nationalId",
              created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const params = [tenantId, name, email.toLowerCase(), phone, nationalId];
  const { rows } = await db.query(query, params);
  return rows[0];
};

const updateByIdAndTenant = async (id, tenantId, updates) => {
  const query = `
    UPDATE customers
    SET name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        national_id = COALESCE($4, national_id),
        updated_at = NOW()
    WHERE id = $5 AND tenant_id = $6
    RETURNING id, tenant_id AS "tenantId", name, email, phone, national_id AS "nationalId",
              created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  const params = [
    updates.name ?? null,
    updates.email ? updates.email.toLowerCase() : null,
    updates.phone ?? null,
    updates.nationalId ?? null,
    id,
    tenantId,
  ];
  const { rows } = await db.query(query, params);
  return rows[0] || null;
};

const deleteByIdAndTenant = async (id, tenantId) => {
  const query = `
    DELETE FROM customers
    WHERE id = $1 AND tenant_id = $2
    RETURNING id
  `;
  const { rowCount } = await db.query(query, [id, tenantId]);
  return rowCount > 0;
};

module.exports = {
  findAllByTenant,
  findByIdAndTenant,
  findByEmailAndTenant,
  create,
  updateByIdAndTenant,
  deleteByIdAndTenant,
};