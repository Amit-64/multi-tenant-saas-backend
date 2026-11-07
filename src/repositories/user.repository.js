const db = require('../config/db');

const findAllByTenant = async (tenantId) => {
  const query = `
    SELECT u.id,
           u.tenant_id AS "tenantId",
           u.email,
           u.status,
           u.created_at AS "createdAt",
           COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.tenant_id = $1
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  const { rows } = await db.query(query, [tenantId]);
  return rows;
};

const findByIdAndTenant = async (id, tenantId) => {
  const query = `
    SELECT u.id,
           u.tenant_id AS "tenantId",
           u.email,
           u.status,
           u.created_at AS "createdAt",
           COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.id = $1 AND u.tenant_id = $2
    GROUP BY u.id
  `;
  const { rows } = await db.query(query, [id, tenantId]);
  return rows[0] || null;
};

const createUserWithRole = async ({ tenantId, email, passwordHash, roleName }) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

  
    const roleQuery = `
      SELECT id, name
      FROM roles
      WHERE tenant_id = $1 AND name = $2
    `;
    const { rows: roleRows } = await client.query(roleQuery, [tenantId, roleName]);
    const role = roleRows[0];

    if (!role) {
      throw new Error(`Role ${roleName} not found for tenant`);
    }

   
    const userQuery = `
      INSERT INTO users (tenant_id, email, password_hash, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      RETURNING id, tenant_id AS "tenantId", email, status, created_at AS "createdAt"
    `;
    const { rows: userRows } = await client.query(userQuery, [
      tenantId,
      email.toLowerCase(),
      passwordHash,
    ]);
    const user = userRows[0];

    const userRoleQuery = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `;
    await client.query(userRoleQuery, [user.id, role.id]);

    await client.query('COMMIT');

    return {
      ...user,
      roles: [role.name],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateUserRole = async ({ userId, tenantId, roleName }) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const roleQuery = `
      SELECT id, name
      FROM roles
      WHERE tenant_id = $1 AND name = $2
    `;
    const { rows: roleRows } = await client.query(roleQuery, [tenantId, roleName]);
    const role = roleRows[0];

    if (!role) {
      throw new Error(`Role ${roleName} not found for tenant`);
    }

    await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
    await client.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [userId, role.id]
    );

    await client.query('COMMIT');
    return role.name;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  findAllByTenant,
  findByIdAndTenant,
  createUserWithRole,
  updateUserRole,
};