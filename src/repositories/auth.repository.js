const db = require('../config/db');

const createTenantWithAdmin = async ({ tenantName, email, passwordHash }) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const tenantQuery = `
      INSERT INTO tenants (name, status)
      VALUES ($1, 'ACTIVE')
      RETURNING id, name, status, created_at AS "createdAt"
    `;
    const { rows: tenantRows } = await client.query(tenantQuery, [tenantName]);
    const tenant = tenantRows[0];

    
    const rolesQuery = `
      INSERT INTO roles (tenant_id, name, description)
      VALUES
        ($1, 'ADMIN', 'Full administrative access within the tenant'),
        ($1, 'MANAGER', 'Can create and update resources within the tenant'),
        ($1, 'VIEWER', 'Read-only access within the tenant')
      RETURNING id, name
    `;
    const { rows: roleRows } = await client.query(rolesQuery, [tenant.id]);
    const adminRole = roleRows.find((role) => role.name === 'ADMIN');

    const userQuery = `
      INSERT INTO users (tenant_id, email, password_hash, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      RETURNING id, tenant_id AS "tenantId", email, status, created_at AS "createdAt"
    `;
    const { rows: userRows } = await client.query(userQuery, [
      tenant.id,
      email.toLowerCase(),
      passwordHash,
    ]);
    const user = userRows[0];

    const userRoleQuery = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `;
    await client.query(userRoleQuery, [user.id, adminRole.id]);

    await client.query('COMMIT');

    return {
      tenant,
      user: {
        ...user,
        roles: ['ADMIN'],
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findUserByEmailAndTenant = async (email, tenantId) => {
  const query = `
    SELECT u.id,
           u.tenant_id AS "tenantId",
           u.email,
           u.password_hash AS "passwordHash",
           u.status,
           COALESCE(ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE LOWER(u.email) = LOWER($1) AND u.tenant_id = $2
    GROUP BY u.id
  `;
  const { rows } = await db.query(query, [email, tenantId]);
  return rows[0] || null;
};

module.exports = {
  createTenantWithAdmin,
  findUserByEmailAndTenant,
};